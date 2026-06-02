"""
Provider service: manages LLM providers and their (encrypted) API keys.

API keys are encrypted at rest with Fernet (symmetric) using
``settings.encryption_key``. Plaintext keys never leave this service: the API
returns only masked keys (``sk-…1234``), and the LLM client gets a decrypted key
solely to attach the ``Authorization`` header on an outbound request.

A "resolved provider" combines a built-in preset with any stored overrides and
the decrypted key, ready for use by the LLM client.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from cryptography.fernet import Fernet, InvalidToken

from config import settings
from errors import UpstreamError, ValidationError
from providers import OPENAI, ProviderPreset, get_preset, list_presets

logger = logging.getLogger(__name__)


@dataclass
class ResolvedProvider:
    """A provider ready to use: preset + overrides + decrypted key."""

    id: str
    name: str
    protocol: str
    base_url: str
    models_path: str
    api_key: Optional[str]
    default_models: List[str]


def _mask(api_key: str) -> str:
    if not api_key:
        return ""
    if len(api_key) <= 8:
        return "••••"
    return f"{api_key[:3]}…{api_key[-4:]}"


class ProviderService:
    def __init__(self, db_service):
        self.db_service = db_service
        self._fernet: Optional[Fernet] = None
        if settings.encryption_key:
            try:
                self._fernet = Fernet(settings.encryption_key.encode())
            except (ValueError, TypeError):
                logger.error("ENCRYPTION_KEY is not a valid Fernet key; provider keys disabled")

    # ── encryption ────────────────────────────────────────────────────────────

    @property
    def encryption_available(self) -> bool:
        return self._fernet is not None

    def _encrypt(self, plaintext: str) -> str:
        if not self._fernet:
            raise ValidationError(
                "Server has no ENCRYPTION_KEY configured; cannot store provider API keys."
            )
        return self._fernet.encrypt(plaintext.encode()).decode()

    def _decrypt(self, ciphertext: str) -> str:
        if not self._fernet:
            return ""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken:
            logger.error("Failed to decrypt a provider key (wrong ENCRYPTION_KEY?)")
            return ""

    # ── local base URLs come from settings ────────────────────────────────────

    @staticmethod
    def _preset_base_url(preset: ProviderPreset) -> str:
        if preset.id == "ollama-default":
            return settings.ollama_url
        if preset.id == "lmstudio-default":
            return settings.lmstudio_url
        return preset.base_url

    @property
    def _collection(self):
        return self.db_service.db.providers

    # ── public API ────────────────────────────────────────────────────────────

    async def list_providers(self) -> List[Dict[str, Any]]:
        """Presets overlaid with stored config, keys masked. For the UI."""
        stored = {
            d["provider_id"]: d
            async for d in self._collection.find({}, {"_id": 0})
        }
        out: List[Dict[str, Any]] = []
        for preset in list_presets():
            doc = stored.get(preset.id)
            base_url = (doc or {}).get("base_url") or self._preset_base_url(preset)
            enabled = (doc or {}).get("enabled", preset.local)
            key_ct = (doc or {}).get("api_key_encrypted", "")
            out.append(
                {
                    "id": preset.id,
                    "name": (doc or {}).get("name") or preset.name,
                    "protocol": preset.protocol,
                    "base_url": base_url,
                    "requires_key": preset.requires_key,
                    "has_key": bool(key_ct),
                    "masked_key": _mask(self._decrypt(key_ct)) if key_ct else "",
                    "enabled": enabled,
                    "local": preset.local,
                    "default_models": preset.default_models,
                }
            )
        # Custom user providers not backed by a preset (id == "custom" handled above)
        return out

    async def resolve(self, provider_id: str) -> ResolvedProvider:
        """Resolve a provider for use by the LLM client (decrypted key)."""
        preset = get_preset(provider_id)
        doc = await self._collection.find_one({"provider_id": provider_id}, {"_id": 0})

        if not preset and not doc:
            raise UpstreamError(f"Unknown provider: {provider_id}")

        protocol = (doc or {}).get("protocol") or (preset.protocol if preset else OPENAI)
        base_url = (doc or {}).get("base_url") or (
            self._preset_base_url(preset) if preset else ""
        )
        name = (doc or {}).get("name") or (preset.name if preset else provider_id)
        models_path = (doc or {}).get("models_path") or (
            preset.models_path if preset else "/models"
        )
        default_models = preset.default_models if preset else []
        api_key = self._decrypt(doc["api_key_encrypted"]) if doc and doc.get("api_key_encrypted") else None

        if not base_url:
            raise UpstreamError(f"Provider {provider_id} has no base URL configured.")

        return ResolvedProvider(
            id=provider_id,
            name=name,
            protocol=protocol,
            base_url=base_url.rstrip("/"),
            models_path=models_path,
            api_key=api_key,
            default_models=default_models,
        )

    async def upsert_provider(
        self,
        provider_id: str,
        *,
        name: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        enabled: bool = True,
    ) -> Dict[str, Any]:
        """Create or update a provider; encrypts the key if supplied."""
        preset = get_preset(provider_id)
        protocol = preset.protocol if preset else OPENAI
        models_path = preset.models_path if preset else "/models"
        resolved_base = base_url or (self._preset_base_url(preset) if preset else "")

        if not resolved_base:
            raise ValidationError("A base URL is required for this provider.")

        update: Dict[str, Any] = {
            "provider_id": provider_id,
            "name": name or (preset.name if preset else provider_id),
            "protocol": protocol,
            "base_url": resolved_base,
            "models_path": models_path,
            "enabled": enabled,
            "updated_at": datetime.utcnow(),
        }
        if api_key:
            update["api_key_encrypted"] = self._encrypt(api_key)

        await self._collection.update_one(
            {"provider_id": provider_id},
            {"$set": update, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True,
        )
        # Return the masked view for this provider.
        for p in await self.list_providers():
            if p["id"] == provider_id:
                return p
        return {"id": provider_id, **update, "api_key_encrypted": None}

    async def delete_provider(self, provider_id: str) -> bool:
        result = await self._collection.delete_one({"provider_id": provider_id})
        return result.deleted_count > 0

    async def test_provider(self, provider_id: str) -> Dict[str, Any]:
        """Probe the provider's models endpoint to confirm reachability + auth."""
        provider = await self.resolve(provider_id)
        url = f"{provider.base_url}{provider.models_path}"
        headers = {}
        if provider.api_key:
            headers["Authorization"] = f"Bearer {provider.api_key}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
            ok = resp.status_code == 200
            return {"ok": ok, "status": resp.status_code}
        except httpx.HTTPError as exc:
            return {"ok": False, "error": str(exc)}

    async def seed_bootstrap_keys(self) -> None:
        """Seed providers from env bootstrap keys on startup (idempotent)."""
        if not self.encryption_available:
            return
        bootstrap = {
            "openai": settings.openai_api_key,
            "openrouter": settings.openrouter_api_key,
            "groq": settings.groq_api_key,
        }
        for provider_id, key in bootstrap.items():
            if not key:
                continue
            existing = await self._collection.find_one({"provider_id": provider_id})
            if existing and existing.get("api_key_encrypted"):
                continue
            await self.upsert_provider(provider_id, api_key=key, enabled=True)
            logger.info("Seeded bootstrap provider: %s", provider_id)
