from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthStatus(BaseModel):
    status: str
    backends: Dict[str, bool]
    details: Optional[Dict[str, str]] = None


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """Comprehensive health check for API and LLM backends"""

    backends = {
        "ollama": False,
        "lmstudio": False,
    }

    details = {}

    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                backends["ollama"] = True
                details["ollama"] = "Available"
            else:
                details["ollama"] = f"HTTP {response.status_code}"
    except Exception as e:
        details["ollama"] = "Offline"
        logger.debug(f"Ollama health check failed: {e}")

    # Check LM Studio
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:1234/v1/models")
            if response.status_code == 200:
                backends["lmstudio"] = True
                details["lmstudio"] = "Available"
            else:
                details["lmstudio"] = f"HTTP {response.status_code}"
    except Exception as e:
        details["lmstudio"] = "Offline"
        logger.debug(f"LM Studio health check failed: {e}")

    # Determine overall status
    status = "healthy" if any(backends.values()) else "degraded"

    return HealthStatus(status=status, backends=backends, details=details)


@router.get("/health/ollama")
async def check_ollama():
    """Check if Ollama is available"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                return {"available": True, "models": response.json().get("models", [])}
    except Exception as e:
        logger.debug(f"Ollama check failed: {e}")

    return {"available": False, "error": "Ollama is not running"}


@router.get("/health/lmstudio")
async def check_lmstudio():
    """Check if LM Studio is available"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:1234/v1/models")
            if response.status_code == 200:
                return {"available": True, "models": response.json().get("data", [])}
    except Exception as e:
        logger.debug(f"LM Studio check failed: {e}")

    return {"available": False, "error": "LM Studio is not running"}
