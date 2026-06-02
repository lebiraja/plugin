"""SessionService: write coalescing, title generation, file records."""

import pytest

from services.session_service import SessionService


@pytest.mark.asyncio
async def test_create_and_get_session(mock_db, fake_llm):
    svc = SessionService(llm_service=fake_llm)
    result = await svc.create_session("ollama-default", "llama3", {"temperature": 0.7})
    session = await svc.get_session(result["session_id"])
    assert session["title"] == "New Chat"
    assert session["model_config"]["backend"] == "ollama-default"


@pytest.mark.asyncio
async def test_add_message_is_single_coalesced_write(mock_db, fake_llm):
    svc = SessionService(llm_service=fake_llm)
    sid = (await svc.create_session("ollama-default", "m", {}))["session_id"]

    await svc.add_message(
        sid,
        {
            "role": "assistant",
            "content": "hello world",
            "tokens": {"total": 42},
            "tools_used": {"web_search": True, "rag": True},
        },
    )

    session = await svc.get_session(sid)
    meta = session["metadata"]
    assert meta["total_messages"] == 1
    assert meta["total_tokens"] == 42
    assert meta["tools_usage_count"]["web_search"] == 1
    assert meta["tools_usage_count"]["rag"] == 1
    assert meta["last_message_preview"].startswith("hello world")


@pytest.mark.asyncio
async def test_generate_title_derives_backend_from_session(mock_db, fake_llm):
    fake_llm.responses.append("Rust Memory Safety")
    svc = SessionService(llm_service=fake_llm)
    sid = (await svc.create_session("ollama-default", "llama3", {}))["session_id"]

    # 2-arg form (manual endpoint): backend/model derived from the session.
    title = await svc.generate_title(sid, "what is rust?")
    assert title == "Rust Memory Safety"
    assert fake_llm.calls[-1]["backend"] == "ollama-default"
    assert fake_llm.calls[-1]["model"] == "llama3"


@pytest.mark.asyncio
async def test_add_file_returns_record_with_id(mock_db, fake_llm):
    svc = SessionService(llm_service=fake_llm)
    sid = (await svc.create_session("ollama-default", "m", {}))["session_id"]
    stored = await svc.add_file_to_session(sid, {"filename": "a.pdf", "path": "/x"})
    assert stored is not None
    assert "file_id" in stored
