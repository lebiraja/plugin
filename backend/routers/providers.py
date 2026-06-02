"""Provider management: list, add/update, test, delete LLM providers."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from dependencies import get_provider_service
from errors import NotFoundError
from services.provider_service import ProviderService

logger = logging.getLogger(__name__)
router = APIRouter()


class UpsertProviderRequest(BaseModel):
    # The preset id (openai/openrouter/groq/…/custom). For "custom", a base_url
    # is required and a unique id may be supplied.
    id: str = Field(..., min_length=1)
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    enabled: bool = True


@router.get("")
async def list_providers(
    service: ProviderService = Depends(get_provider_service),
):
    """All providers (presets + stored), with masked keys. Safe for the UI."""
    return {
        "providers": await service.list_providers(),
        "encryption_available": service.encryption_available,
    }


@router.post("")
async def upsert_provider(
    request: UpsertProviderRequest,
    service: ProviderService = Depends(get_provider_service),
):
    """Add or update a provider. The API key (if given) is encrypted at rest."""
    return await service.upsert_provider(
        request.id,
        name=request.name,
        base_url=request.base_url,
        api_key=request.api_key,
        enabled=request.enabled,
    )


@router.post("/{provider_id}/test")
async def test_provider(
    provider_id: str,
    service: ProviderService = Depends(get_provider_service),
):
    """Probe the provider to confirm it's reachable and the key works."""
    return await service.test_provider(provider_id)


@router.delete("/{provider_id}")
async def delete_provider(
    provider_id: str,
    service: ProviderService = Depends(get_provider_service),
):
    """Remove a stored provider override (presets remain available)."""
    if not await service.delete_provider(provider_id):
        raise NotFoundError("Provider not found")
    return {"success": True}
