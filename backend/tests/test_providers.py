"""Provider registry, encryption, and the providers/models API."""

import pytest

from services.provider_service import ProviderService, _mask


def test_mask_hides_the_key():
    assert _mask("sk-secret-12345") == "sk-…2345"
    assert _mask("") == ""
    assert _mask("short") == "••••"


@pytest.mark.asyncio
async def test_upsert_encrypts_key_and_lists_masked(provider_service, mock_db):
    await provider_service.upsert_provider("openai", api_key="sk-supersecret123", enabled=True)

    # Stored ciphertext is NOT the plaintext.
    doc = await mock_db.providers.find_one({"provider_id": "openai"})
    assert doc["api_key_encrypted"] != "sk-supersecret123"
    assert "supersecret" not in doc["api_key_encrypted"]

    # The list view masks it.
    listing = await provider_service.list_providers()
    openai = next(p for p in listing if p["id"] == "openai")
    assert openai["has_key"] is True
    assert openai["masked_key"] == "sk-…t123"
    assert "supersecret" not in openai["masked_key"]


@pytest.mark.asyncio
async def test_resolve_decrypts_for_use(provider_service):
    await provider_service.upsert_provider("groq", api_key="gsk-abc-9999")
    resolved = await provider_service.resolve("groq")
    assert resolved.api_key == "gsk-abc-9999"
    assert resolved.base_url == "https://api.groq.com/openai/v1"
    assert resolved.protocol == "openai"


@pytest.mark.asyncio
async def test_resolve_local_uses_settings_url(provider_service):
    resolved = await provider_service.resolve("ollama-default")
    assert resolved.protocol == "ollama"
    assert resolved.api_key is None
    assert "11434" in resolved.base_url


@pytest.mark.asyncio
async def test_resolve_unknown_raises(provider_service):
    from errors import UpstreamError

    with pytest.raises(UpstreamError):
        await provider_service.resolve("nope-not-a-provider")


@pytest.mark.asyncio
async def test_encryption_unavailable_rejects_key(monkeypatch, mock_db):
    from services.database_service import db_service

    svc = ProviderService(db_service)
    svc._fernet = None  # simulate no ENCRYPTION_KEY
    from errors import ValidationError

    with pytest.raises(ValidationError):
        await svc.upsert_provider("openai", api_key="sk-x")


# ── API layer ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_providers_endpoint(client):
    resp = await client.get("/api/providers")
    assert resp.status_code == 200
    body = resp.json()
    ids = {p["id"] for p in body["providers"]}
    assert {"ollama-default", "openai", "openrouter", "groq", "custom"} <= ids
    assert body["encryption_available"] is True


@pytest.mark.asyncio
async def test_add_provider_endpoint_returns_masked(client):
    resp = await client.post(
        "/api/providers",
        json={"id": "openrouter", "api_key": "sk-or-abcd1234", "enabled": True},
    )
    assert resp.status_code == 200
    assert resp.json()["has_key"] is True
    assert "abcd1234" not in resp.json().get("masked_key", "sk-or-abcd1234")


@pytest.mark.asyncio
async def test_models_curated_fallback(client):
    # No real network in tests -> the cloud models endpoint fails -> fallback.
    await client.post("/api/providers", json={"id": "groq", "api_key": "gsk-x"})
    resp = await client.get("/api/models/groq")
    assert resp.status_code == 200
    models = resp.json()["models"]
    assert "llama-3.3-70b-versatile" in models
