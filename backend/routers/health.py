"""Health checks for the API and its providers."""

import logging
from typing import Dict, Optional

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from config import settings
from dependencies import get_provider_service
from providers import OLLAMA
from services.provider_service import ProviderService

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthStatus(BaseModel):
    status: str
    backends: Dict[str, bool]
    details: Optional[Dict[str, str]] = None


async def _probe(url: str, headers: Optional[Dict[str, str]] = None) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, headers=headers or {})
            return response.status_code == 200
    except Exception as exc:
        logger.debug("Health probe failed for %s: %s", url, exc)
        return False


@router.get("/health", response_model=HealthStatus)
async def health_check(
    providers: ProviderService = Depends(get_provider_service),
):
    """
    Overall API health plus per-provider availability.

    Local providers (Ollama/LM Studio) are probed live. Cloud providers are
    reported available when they're enabled and have a key configured (we don't
    spend a request probing them on every health tick).
    """
    backends: Dict[str, bool] = {}
    details: Dict[str, str] = {}

    for p in await providers.list_providers():
        if not p["enabled"]:
            continue
        if p["local"]:
            provider = await providers.resolve(p["id"])
            ok = await _probe(f"{provider.base_url}{provider.models_path}")
        else:
            ok = p["has_key"] or not p["requires_key"]
        backends[p["id"]] = ok
        details[p["id"]] = "Available" if ok else "Unavailable"

    # Back-compat keys for the existing frontend banner.
    backends.setdefault("ollama", backends.get("ollama-default", False))
    backends.setdefault("lmstudio", backends.get("lmstudio-default", False))

    status = "healthy" if any(backends.values()) else "degraded"
    return HealthStatus(status=status, backends=backends, details=details)


@router.get("/health/ollama")
async def check_ollama():
    if await _probe(f"{settings.ollama_url}/api/tags"):
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_url}/api/tags")
            return {"available": True, "models": response.json().get("models", [])}
    return {"available": False, "error": "Ollama is not running"}
