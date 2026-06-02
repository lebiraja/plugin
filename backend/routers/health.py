"""Health checks for the API and its LLM backends."""

import logging
from typing import Dict, Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthStatus(BaseModel):
    status: str
    backends: Dict[str, bool]
    details: Optional[Dict[str, str]] = None


async def _probe(url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url)
            return response.status_code == 200
    except Exception as exc:
        logger.debug("Health probe failed for %s: %s", url, exc)
        return False


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """Overall API health plus per-backend availability."""
    ollama_ok = await _probe(f"{settings.ollama_url}/api/tags")
    lmstudio_ok = await _probe(f"{settings.lmstudio_url}/v1/models")

    backends = {"ollama": ollama_ok, "lmstudio": lmstudio_ok}
    details = {
        "ollama": "Available" if ollama_ok else "Offline",
        "lmstudio": "Available" if lmstudio_ok else "Offline",
    }
    status = "healthy" if any(backends.values()) else "degraded"
    return HealthStatus(status=status, backends=backends, details=details)


@router.get("/health/ollama")
async def check_ollama():
    if await _probe(f"{settings.ollama_url}/api/tags"):
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.ollama_url}/api/tags")
            return {"available": True, "models": response.json().get("models", [])}
    return {"available": False, "error": "Ollama is not running"}


@router.get("/health/lmstudio")
async def check_lmstudio():
    if await _probe(f"{settings.lmstudio_url}/v1/models"):
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.lmstudio_url}/v1/models")
            return {"available": True, "models": response.json().get("data", [])}
    return {"available": False, "error": "LM Studio is not running"}
