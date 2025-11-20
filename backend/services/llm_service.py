import httpx
from typing import Dict, Any, AsyncGenerator
import json


class LLMService:
    """Service for interacting with different LLM backends"""

    def __init__(self):
        self.backend_urls = {
            "ollama-default": "http://localhost:11434",
            "lmstudio-default": "http://localhost:1234",
        }

    async def generate_response(
        self, message: str, backend: str, model: str, config: Dict[str, Any], history: list = None
    ) -> Dict[str, Any]:
        """Generate a response from the specified backend"""
        if history is None:
            history = []
        
        if backend == "ollama-default":
            return await self._ollama_generate(message, model, config, history)
        elif backend == "lmstudio-default":
            return await self._lmstudio_generate(message, model, config, history)
        else:
            raise ValueError(f"Unsupported backend: {backend}")

    async def stream_response(
        self, message: str, backend: str, model: str, config: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream a response from the specified backend"""
        
        if backend == "ollama-default":
            async for chunk in self._ollama_stream(message, model, config):
                yield chunk
        elif backend == "lmstudio-default":
            async for chunk in self._lmstudio_stream(message, model, config):
                yield chunk

    async def _ollama_generate(
        self, message: str, model: str, config: Dict[str, Any], history: list = None
    ) -> Dict[str, Any]:
        """Generate response using Ollama"""
        url = f"{self.backend_urls['ollama-default']}/api/generate"
        
        # Build context from history
        prompt = message
        if history:
            context_messages = []
            for msg in history[-10:]:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                prefix = "User: " if role == 'user' else "Assistant: "
                context_messages.append(f"{prefix}{content}")
            
            context = "\n".join(context_messages)
            prompt = f"{context}\nUser: {message}\nAssistant:"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": config.get("temperature", 0.7),
                "top_p": config.get("topP", 0.9),
                "num_predict": config.get("maxTokens", 2048),
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        return {
            "content": data.get("response", ""),
            "model": model,
            "backend": "ollama",
            "tokens": {
                "prompt": data.get("prompt_eval_count", 0),
                "completion": data.get("eval_count", 0),
                "total": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            },
        }

    async def _lmstudio_generate(
        self, message: str, model: str, config: Dict[str, Any], history: list = None
    ) -> Dict[str, Any]:
        """Generate response using LM Studio"""
        url = f"{self.backend_urls['lmstudio-default']}/v1/chat/completions"
        
        # Build messages from history
        messages = []
        if history:
            # Include last 10 messages for context
            messages = history[-10:]
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": config.get("temperature", 0.7),
            "top_p": config.get("topP", 0.9),
            "max_tokens": config.get("maxTokens", 2048),
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

        choice = data["choices"][0]
        usage = data.get("usage", {})

        return {
            "content": choice["message"]["content"],
            "model": model,
            "backend": "lmstudio",
            "tokens": {
                "prompt": usage.get("prompt_tokens", 0),
                "completion": usage.get("completion_tokens", 0),
                "total": usage.get("total_tokens", 0),
            },
        }

    async def _ollama_stream(
        self, message: str, model: str, config: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream response from Ollama"""
        url = f"{self.backend_urls['ollama-default']}/api/generate"
        
        payload = {
            "model": model,
            "prompt": message,
            "stream": True,
            "options": {
                "temperature": config.get("temperature", 0.7),
                "top_p": config.get("topP", 0.9),
                "num_predict": config.get("maxTokens", 2048),
            },
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream('POST', url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        if "response" in data:
                            yield data["response"]

    async def _lmstudio_stream(
        self, message: str, model: str, config: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Stream response from LM Studio"""
        url = f"{self.backend_urls['lmstudio-default']}/v1/chat/completions"
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": message}],
            "temperature": config.get("temperature", 0.7),
            "top_p": config.get("topP", 0.9),
            "max_tokens": config.get("maxTokens", 2048),
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream('POST', url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line and line.startswith("data: "):
                        data_str = line[6:]
                        if data_str != "[DONE]":
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
