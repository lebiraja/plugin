"""Model discovery — works for any provider (local or cloud)."""

import logging

import httpx
from fastapi import APIRouter, Depends

from dependencies import get_provider_service
from providers import OLLAMA
from services.provider_service import ProviderService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{backend}")
async def get_models(
    backend: str, providers: ProviderService = Depends(get_provider_service)
):
    """
    List model names for a provider. Hits the provider's models endpoint
    (`/api/tags` for Ollama, `/v1/models`-style for OpenAI-compatible) with a
    bearer key when present; falls back to the preset's curated default list.
    """
    provider = await providers.resolve(backend)
    url = f"{provider.base_url}{provider.models_path}"
    headers = {}
    if provider.api_key:
        headers["Authorization"] = f"Bearer {provider.api_key}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        if provider.protocol == OLLAMA:
            models = [m["name"] for m in data.get("models", [])]
        else:
            models = [m["id"] for m in data.get("data", [])]
        if models:
            return {"models": sorted(models)}
        logger.info("No models from %s; using curated fallback", backend)
    except httpx.HTTPError as exc:
        logger.warning("Model fetch failed for %s: %s; using fallback", backend, exc)

    return {"models": provider.default_models}
