"""Integration secrets: manage the web-search (Serper) API key from the UI."""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from dependencies import get_secret_service
from errors import ValidationError
from services.secret_service import SERPER_KEY, SecretService

logger = logging.getLogger(__name__)
router = APIRouter()


class SetSearchKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=1)


@router.get("/search")
async def get_search_integration(
    secrets: SecretService = Depends(get_secret_service),
):
    """Masked view of the Serper key + whether encryption is configured."""
    masked = await secrets.get_masked(SERPER_KEY)
    return {
        "provider": "serper",
        **masked,
        "name": "Serper.dev (web search)",  # friendly name overrides the storage key
        "encryption_available": secrets.encryption_available,
    }


@router.put("/search")
async def set_search_key(
    request: SetSearchKeyRequest,
    secrets: SecretService = Depends(get_secret_service),
):
    """Store (encrypted) the Serper API key."""
    if not secrets.encryption_available:
        raise ValidationError(
            "Server has no ENCRYPTION_KEY configured; cannot store the search key."
        )
    return await secrets.set_secret(SERPER_KEY, request.api_key)


@router.post("/search/test")
async def test_search_key(
    secrets: SecretService = Depends(get_secret_service),
):
    """Probe Serper with the stored key to confirm it works."""
    import httpx

    key = await secrets.get_secret(SERPER_KEY)
    if not key:
        return {"ok": False, "error": "No key set"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                json={"q": "test", "num": 1},
                headers={"X-API-KEY": key, "Content-Type": "application/json"},
            )
        return {"ok": resp.status_code == 200, "status": resp.status_code}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": str(exc)}


@router.delete("/search")
async def delete_search_key(
    secrets: SecretService = Depends(get_secret_service),
):
    """Remove the stored Serper key (search falls back to DuckDuckGo)."""
    await secrets.delete_secret(SERPER_KEY)
    return {"success": True}
