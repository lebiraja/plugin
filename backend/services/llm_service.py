"""
LLM service: a thin, uniform client over the supported chat backends.

Both Ollama and LM Studio expose an OpenAI-style chat endpoint that takes a
``messages`` array, so we build messages once and stream tokens from either.
Backend base URLs come from :mod:`config` — never hardcoded — so the same code
works on bare metal (localhost) and in Docker (service names).
"""

import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

# Backend identifiers used by the API/frontend, mapped to their config URL.
OLLAMA_BACKEND = "ollama-default"
LMSTUDIO_BACKEND = "lmstudio-default"

DEFAULT_TIMEOUT = httpx.Timeout(120.0, connect=10.0)


class LLMService:
    """Stateless client for chat-completion backends."""

    def __init__(self) -> None:
        self._backend_urls = {
            OLLAMA_BACKEND: settings.ollama_url,
            LMSTUDIO_BACKEND: settings.lmstudio_url,
        }

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

        if backend == OLLAMA_BACKEND:
            stream = self._ollama_stream(model, messages, config)
        elif backend == LMSTUDIO_BACKEND:
            stream = self._lmstudio_stream(model, messages, config)
        else:
            raise ValueError(f"Unsupported backend: {backend}")

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
        self, model: str, messages: List[Dict[str, str]], config: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"{self._backend_urls[OLLAMA_BACKEND]}/api/chat"
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

    # ── LM Studio (/v1/chat/completions, OpenAI SSE) ─────────────────────────

    async def _lmstudio_stream(
        self, model: str, messages: List[Dict[str, str]], config: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        url = f"{self._backend_urls[LMSTUDIO_BACKEND]}/v1/chat/completions"
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

        prompt_tokens = 0
        completion_tokens = 0
        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        body = (await response.aread()).decode(errors="replace")
                        raise LLMBackendError(
                            f"LM Studio error ({response.status_code}): {body[:500]}"
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
            logger.error("LM Studio request failed: %s", exc)
            raise LLMBackendError(f"LM Studio request failed: {exc}") from exc

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
