"""
LLM service: a thin, uniform client over every supported provider.

Providers come in two protocols: Ollama's native API and the OpenAI-compatible
``/v1/chat/completions`` format (LM Studio, OpenAI, OpenRouter, Groq, …). We
build messages once and stream tokens from either. The provider's base URL,
protocol, and (decrypted) API key are resolved via ProviderService — never
hardcoded — so the same code serves local and cloud backends.
"""

import json
import logging
from typing import TYPE_CHECKING, Any, AsyncGenerator, Dict, List, Optional

import httpx

from providers import OLLAMA, OPENAI

if TYPE_CHECKING:
    from services.provider_service import ProviderService, ResolvedProvider

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = httpx.Timeout(120.0, connect=10.0)


class LLMService:
    """
    Stateless client for chat-completion backends across all providers.

    Given a backend/provider id, it resolves the provider (base URL, protocol,
    and decrypted key) via ProviderService and dispatches to the matching
    protocol handler — ``ollama`` (native) or ``openai`` (the OpenAI-compatible
    format used by LM Studio, OpenAI, OpenRouter, Groq, …).
    """

    def __init__(self, provider_service: "ProviderService") -> None:
        self._providers = provider_service

    # ── public API ───────────────────────────────────────────────────────────

    async def generate_response(
        self,
        message: str,
        backend: str,
        model: str,
        config: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
        system: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Non-streaming convenience wrapper: drain the stream into one result."""
        content_parts: List[str] = []
        tokens: Dict[str, int] = {"prompt": 0, "completion": 0, "total": 0}

        async for event in self.stream_chat(
            message=message,
            backend=backend,
            model=model,
            config=config,
            history=history,
            system=system,
        ):
            if event["type"] == "token":
                content_parts.append(event["content"])
            elif event["type"] == "done":
                tokens = event.get("tokens", tokens)

        return {
            "content": "".join(content_parts),
            "model": model,
            "backend": backend,
            "tokens": tokens,
        }

    async def stream_chat(
        self,
        message: str,
        backend: str,
        model: str,
        config: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
        system: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream a chat completion.

        Yields events:
          {"type": "token", "content": str}
          {"type": "done", "tokens": {"prompt", "completion", "total"}}
        """
        messages = self._build_messages(message, history, system)
        provider = await self._providers.resolve(backend)

        if provider.protocol == OLLAMA:
            stream = self._ollama_stream(provider, model, messages, config)
        elif provider.protocol == OPENAI:
            stream = self._openai_compatible_stream(provider, model, messages, config)
        else:
            raise LLMBackendError(f"Unsupported protocol: {provider.protocol}")

        async for event in stream:
            yield event

    # ── message construction ─────────────────────────────────────────────────

    @staticmethod
    def _build_messages(
        message: str,
        history: Optional[List[Dict[str, str]]],
        system: Optional[str],
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        if history:
            for msg in history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})
        return messages

    @staticmethod
    def _options(config: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "temperature": config.get("temperature", 0.7),
            "top_p": config.get("topP", config.get("top_p", 0.9)),
            "num_predict": config.get("maxTokens", config.get("max_tokens", 2048)),
        }

    # ── Ollama (/api/chat) ───────────────────────────────────────────────────

    async def _ollama_stream(
        self,
        provider: "ResolvedProvider",
        model: str,
        messages: List[Dict[str, str]],
        config: Dict[str, Any],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"{provider.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": self._options(config),
        }

        prompt_tokens = 0
        completion_tokens = 0
        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        body = (await response.aread()).decode(errors="replace")
                        raise LLMBackendError(
                            f"Ollama error ({response.status_code}): {body[:500]}"
                        )
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        data = json.loads(line)
                        chunk = data.get("message", {}).get("content")
                        if chunk:
                            yield {"type": "token", "content": chunk}
                        if data.get("done"):
                            prompt_tokens = data.get("prompt_eval_count", 0)
                            completion_tokens = data.get("eval_count", 0)
        except httpx.HTTPError as exc:
            logger.error("Ollama request failed: %s", exc)
            raise LLMBackendError(f"Ollama request failed: {exc}") from exc

        yield self._done_event(prompt_tokens, completion_tokens)

    # ── OpenAI-compatible (/v1/chat/completions SSE) ─────────────────────────
    # Covers LM Studio, OpenAI, OpenRouter, Groq, Together, DeepSeek, and any
    # custom OpenAI-compatible endpoint. A bearer key is attached when present.

    async def _openai_compatible_stream(
        self,
        provider: "ResolvedProvider",
        model: str,
        messages: List[Dict[str, str]],
        config: Dict[str, Any],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"{provider.base_url}/chat/completions"
        opts = self._options(config)
        payload = {
            "model": model,
            "messages": messages,
            "temperature": opts["temperature"],
            "top_p": opts["top_p"],
            "max_tokens": opts["num_predict"],
            "stream": True,
            "stream_options": {"include_usage": True},
        }
        headers = {}
        if provider.api_key:
            headers["Authorization"] = f"Bearer {provider.api_key}"

        prompt_tokens = 0
        completion_tokens = 0
        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    if response.status_code != 200:
                        body = (await response.aread()).decode(errors="replace")
                        raise LLMBackendError(
                            f"{provider.name} error ({response.status_code}): {body[:500]}"
                        )
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        data = json.loads(data_str)
                        usage = data.get("usage")
                        if usage:
                            prompt_tokens = usage.get("prompt_tokens", prompt_tokens)
                            completion_tokens = usage.get(
                                "completion_tokens", completion_tokens
                            )
                        choices = data.get("choices") or []
                        if choices:
                            delta = choices[0].get("delta", {})
                            chunk = delta.get("content")
                            if chunk:
                                yield {"type": "token", "content": chunk}
        except httpx.HTTPError as exc:
            logger.error("%s request failed: %s", provider.name, exc)
            raise LLMBackendError(f"{provider.name} request failed: {exc}") from exc

        yield self._done_event(prompt_tokens, completion_tokens)

    @staticmethod
    def _done_event(prompt: int, completion: int) -> Dict[str, Any]:
        return {
            "type": "done",
            "tokens": {
                "prompt": prompt,
                "completion": completion,
                "total": prompt + completion,
            },
        }


class LLMBackendError(RuntimeError):
    """Raised when an LLM backend returns an error or is unreachable."""


def _default_llm_service() -> "LLMService":
    """Build an LLMService backed by a default ProviderService.

    Used as a fallback when a service isn't constructed through DI (direct use,
    some tests). Production always injects the shared instance via dependencies.
    """
    from services import db_service
    from services.provider_service import ProviderService

    return LLMService(provider_service=ProviderService(db_service))
