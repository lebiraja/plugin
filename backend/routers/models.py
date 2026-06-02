"""Model discovery for the configured LLM backends."""

import httpx
from fastapi import APIRouter

from config import settings
from errors import UpstreamError

router = APIRouter()


@router.get("/{backend}")
async def get_models(backend: str):
    """List available model names for a backend (ollama-default / lmstudio-default)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if backend == "ollama-default":
                response = await client.get(f"{settings.ollama_url}/api/tags")
                response.raise_for_status()
                models = [m["name"] for m in response.json().get("models", [])]
                return {"models": models}
            if backend == "lmstudio-default":
                response = await client.get(f"{settings.lmstudio_url}/v1/models")
                response.raise_for_status()
                models = [m["id"] for m in response.json().get("data", [])]
                return {"models": models}
            return {"models": []}
    except httpx.ConnectError as exc:
        raise UpstreamError(
            f"Cannot connect to {backend}. Make sure the service is running."
        ) from exc
    except httpx.HTTPError as exc:
        raise UpstreamError(f"Failed to fetch models from {backend}.") from exc
