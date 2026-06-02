"""Encrypted search-key secret service + integrations API."""

import pytest

from services.secret_service import SERPER_KEY, SecretService, mask_secret


def test_mask_secret():
    assert mask_secret("serper-key-abcd1234") == "ser…1234"
    assert mask_secret("") == ""
    assert mask_secret("short") == "••••"


@pytest.mark.asyncio
async def test_set_get_secret_encrypts(mock_db):
    from services.database_service import db_service

    svc = SecretService(db_service)
    await svc.set_secret(SERPER_KEY, "serper-supersecret-1234")

    # Stored ciphertext is not the plaintext.
    doc = await mock_db.secrets.find_one({"name": SERPER_KEY})
    assert doc["value_encrypted"] != "serper-supersecret-1234"
    assert "supersecret" not in doc["value_encrypted"]

    # Decrypts for use.
    assert await svc.get_secret(SERPER_KEY) == "serper-supersecret-1234"

    # Masked view never leaks the plaintext.
    masked = await svc.get_masked(SERPER_KEY)
    assert masked["has_value"] is True
    assert "supersecret" not in masked["masked_value"]


@pytest.mark.asyncio
async def test_delete_secret(mock_db):
    from services.database_service import db_service

    svc = SecretService(db_service)
    await svc.set_secret(SERPER_KEY, "x-key")
    assert await svc.delete_secret(SERPER_KEY) is True
    assert await svc.get_secret(SERPER_KEY) is None


@pytest.mark.asyncio
async def test_search_service_prefers_stored_key(mock_db):
    from services.database_service import db_service
    from services.search_service import SearchService

    secrets = SecretService(db_service)
    await secrets.set_secret(SERPER_KEY, "stored-serper-key")
    search = SearchService(secret_service=secrets)
    assert await search._resolve_serper_key() == "stored-serper-key"


# ── API ───────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_search_integration_endpoint(client):
    resp = await client.get("/api/integrations/search")
    assert resp.status_code == 200
    body = resp.json()
    assert body["provider"] == "serper"
    assert body["has_value"] is False
    assert body["encryption_available"] is True


@pytest.mark.asyncio
async def test_put_and_mask_search_key(client):
    resp = await client.put(
        "/api/integrations/search", json={"api_key": "serper-live-abcd1234"}
    )
    assert resp.status_code == 200
    assert resp.json()["has_value"] is True
    assert "abcd1234" not in resp.json()["masked_value"]

    # Now reported as set.
    got = await client.get("/api/integrations/search")
    assert got.json()["has_value"] is True


@pytest.mark.asyncio
async def test_delete_search_key_endpoint(client):
    await client.put("/api/integrations/search", json={"api_key": "k"})
    resp = await client.delete("/api/integrations/search")
    assert resp.json()["success"] is True
    assert (await client.get("/api/integrations/search")).json()["has_value"] is False
