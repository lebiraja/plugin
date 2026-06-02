"""
Secret service: encrypted storage for single-value secrets (e.g. the Serper
web-search API key) that aren't full LLM providers.

Mirrors the provider key handling: Fernet-encrypted at rest in a ``secrets``
MongoDB collection, keyed by ``settings.encryption_key``. Values are decrypted
only for use; the API returns masked values (``sk-…1234``).
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from config import settings

logger = logging.getLogger(__name__)


def mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "••••"
    return f"{value[:3]}…{value[-4:]}"


class SecretService:
    """Encrypted key/value secrets in the ``secrets`` collection."""

    def __init__(self, db_service):
        self.db_service = db_service
        self._fernet: Optional[Fernet] = None
        if settings.encryption_key:
            try:
                self._fernet = Fernet(settings.encryption_key.encode())
            except (ValueError, TypeError):
                logger.error("ENCRYPTION_KEY is not a valid Fernet key; secrets disabled")

    @property
    def encryption_available(self) -> bool:
        return self._fernet is not None

    @property
    def _collection(self):
        return self.db_service.db.secrets

    def _encrypt(self, plaintext: str) -> str:
        if not self._fernet:
            raise RuntimeError("No ENCRYPTION_KEY configured; cannot store secrets.")
        return self._fernet.encrypt(plaintext.encode()).decode()

    def _decrypt(self, ciphertext: str) -> str:
        if not self._fernet:
            return ""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except InvalidToken:
            logger.error("Failed to decrypt a secret (wrong ENCRYPTION_KEY?)")
            return ""

    async def get_secret(self, name: str) -> Optional[str]:
        """Decrypted value for use (None if unset)."""
        doc = await self._collection.find_one({"name": name})
        if doc and doc.get("value_encrypted"):
            return self._decrypt(doc["value_encrypted"])
        return None

    async def get_masked(self, name: str) -> dict:
        """Masked view for the UI: {name, has_value, masked_value}."""
        doc = await self._collection.find_one({"name": name})
        value = self._decrypt(doc["value_encrypted"]) if doc and doc.get("value_encrypted") else ""
        return {
            "name": name,
            "has_value": bool(value),
            "masked_value": mask_secret(value),
        }

    async def set_secret(self, name: str, value: str) -> dict:
        """Encrypt and store a secret. Returns the masked view."""
        await self._collection.update_one(
            {"name": name},
            {
                "$set": {
                    "name": name,
                    "value_encrypted": self._encrypt(value),
                    "updated_at": datetime.utcnow(),
                },
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
        )
        return await self.get_masked(name)

    async def delete_secret(self, name: str) -> bool:
        result = await self._collection.delete_one({"name": name})
        return result.deleted_count > 0

    async def seed_bootstrap(self, name: str, value: str) -> None:
        """Seed a secret from env on startup if not already set (idempotent)."""
        if not self.encryption_available or not value:
            return
        existing = await self._collection.find_one({"name": name})
        if existing and existing.get("value_encrypted"):
            return
        await self.set_secret(name, value)
        logger.info("Seeded bootstrap secret: %s", name)


SERPER_KEY = "serper_api_key"
