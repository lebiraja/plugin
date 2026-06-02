"""End-to-end session API tests through the FastAPI app (fakes injected)."""

import pytest


@pytest.mark.asyncio
async def test_create_list_get_delete_session(client):
    created = await client.post(
        "/api/sessions/create", json={"backend": "ollama-default", "model": "m"}
    )
    assert created.status_code == 200
    sid = created.json()["session_id"]

    listed = await client.get("/api/sessions")
    assert listed.json()["total"] == 1

    got = await client.get(f"/api/sessions/{sid}")
    assert got.json()["session_id"] == sid

    deleted = await client.delete(f"/api/sessions/{sid}")
    assert deleted.json()["success"] is True


@pytest.mark.asyncio
async def test_send_message_persists_exchange(client, fake_llm):
    fake_llm.responses.append("the answer is 42")
    sid = (
        await client.post(
            "/api/sessions/create", json={"backend": "ollama-default", "model": "m"}
        )
    ).json()["session_id"]

    resp = await client.post(
        f"/api/sessions/{sid}/message", json={"message": "what is the answer?"}
    )
    assert resp.status_code == 200
    assert resp.json()["content"] == "the answer is 42"

    session = (await client.get(f"/api/sessions/{sid}")).json()
    roles = [m["role"] for m in session["messages"]]
    assert roles == ["user", "assistant"]


@pytest.mark.asyncio
async def test_send_message_rejects_empty(client):
    sid = (
        await client.post(
            "/api/sessions/create", json={"backend": "ollama-default", "model": "m"}
        )
    ).json()["session_id"]
    resp = await client.post(f"/api/sessions/{sid}/message", json={"message": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_missing_session_returns_404(client):
    resp = await client.get("/api/sessions/does-not-exist")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_empty_model_message_returns_422(client):
    # Session created without a model (the real Docker bug).
    sid = (
        await client.post(
            "/api/sessions/create", json={"backend": "ollama-default", "model": ""}
        )
    ).json()["session_id"]
    resp = await client.post(f"/api/sessions/{sid}/message", json={"message": "hi"})
    assert resp.status_code == 422
    assert "model" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_request_model_override_persists(client, fake_llm):
    fake_llm.responses.append("hello")
    sid = (
        await client.post(
            "/api/sessions/create", json={"backend": "ollama-default", "model": ""}
        )
    ).json()["session_id"]

    # Client supplies the selected model; the message should succeed and the
    # session's model_config should be updated.
    resp = await client.post(
        f"/api/sessions/{sid}/message",
        json={"message": "hi", "backend": "ollama-default", "model": "llama3"},
    )
    assert resp.status_code == 200
    # Every LLM call (the response, and any background title generation) uses
    # the overridden model — never the empty stored one.
    assert all(c["model"] == "llama3" for c in fake_llm.calls)

    session = (await client.get(f"/api/sessions/{sid}")).json()
    assert session["model_config"]["model"] == "llama3"
