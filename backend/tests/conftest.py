"""
Shared pytest fixtures.

The whole suite runs without external services: MongoDB is replaced by
mongomock-motor, and the LLM/search backends are replaced by deterministic
fakes injected through FastAPI's dependency-override mechanism. This is exactly
what the DI refactor in dependencies.py enables.
"""

import os
from typing import Any, AsyncGenerator, Dict, List

import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

# Keep file logging out of the way of root-owned dev dirs.
os.environ.setdefault("LOG_DIR", "/tmp/plugin-test-logs")


@pytest.fixture
def fake_llm():
    """A deterministic stand-in for LLMService."""

    class FakeLLM:
        def __init__(self) -> None:
            self.responses: List[str] = []
            self.calls: List[Dict[str, Any]] = []

        async def generate_response(self, **kwargs) -> Dict[str, Any]:
            self.calls.append(kwargs)
            content = self.responses.pop(0) if self.responses else "fake response"
            return {
                "content": content,
                "model": kwargs.get("model", "fake"),
                "backend": kwargs.get("backend", "fake"),
                "tokens": {"prompt": 5, "completion": 7, "total": 12},
            }

        async def stream_chat(self, **kwargs) -> AsyncGenerator[Dict[str, Any], None]:
            self.calls.append(kwargs)
            text = self.responses.pop(0) if self.responses else "fake stream"
            for token in text.split(" "):
                yield {"type": "token", "content": token + " "}
            yield {
                "type": "done",
                "tokens": {"prompt": 5, "completion": 7, "total": 12},
            }

    return FakeLLM()


@pytest.fixture
def fake_search():
    """A deterministic stand-in for SearchService."""

    class FakeSearch:
        async def search(self, query, max_results=5, scrape_content=True):
            return [
                {
                    "title": f"Result for {query}",
                    "url": "https://example.com/1",
                    "snippet": "a snippet",
                    "content": "some scraped content about " + query,
                    "word_count": 5,
                    "relevance_score": 1.0,
                }
            ]

    return FakeSearch()


@pytest_asyncio.fixture
async def mock_db():
    """Wire a mongomock-motor database into the shared db_service singleton."""
    from services.database_service import db_service

    client = AsyncMongoMockClient()
    db = client["plugin_test_db"]
    db_service._client = client
    db_service._db = db
    yield db
    db_service._client = None
    db_service._db = None


@pytest_asyncio.fixture
async def client(mock_db, fake_llm, fake_search):
    """A TestClient with services overridden to the fakes."""
    from httpx import ASGITransport, AsyncClient

    import dependencies
    import main
    from services.session_service import SessionService

    app = main.app
    app.dependency_overrides[dependencies.get_llm_service] = lambda: fake_llm
    app.dependency_overrides[dependencies.get_search_service] = lambda: fake_search
    app.dependency_overrides[dependencies.get_session_service] = lambda: SessionService(
        llm_service=fake_llm
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
