"""
FastAPI dependency providers.

Services are expensive to construct (embedding models, HTTP clients) so we hold
a single shared instance of each and hand it out via ``Depends(...)``. This
replaces the previous pattern of module-level globals duplicated across routers
(``LLMService()`` was instantiated three separate times). Using DI also makes
routers trivially testable: override a provider in a test to inject a fake.
"""

from functools import lru_cache

from motor.motor_asyncio import AsyncIOMotorDatabase

from services import db_service, rag_service
from services.deep_research_service import DeepResearchService
from services.llm_service import LLMService
from services.rag_service import RAGService
from services.search_service import SearchService
from services.session_service import SessionService


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService()


@lru_cache(maxsize=1)
def get_search_service() -> SearchService:
    return SearchService()


def get_rag_service() -> RAGService:
    # RAGService is a singleton constructed in services/__init__ (with its
    # db_service wired in). Reuse that instance rather than rebuilding the
    # embedding model.
    return rag_service


@lru_cache(maxsize=1)
def get_session_service() -> SessionService:
    return SessionService(llm_service=get_llm_service())


@lru_cache(maxsize=1)
def get_deep_research_service() -> DeepResearchService:
    return DeepResearchService(
        llm_service=get_llm_service(),
        search_service=get_search_service(),
        db_service=db_service,
    )


def get_db() -> AsyncIOMotorDatabase:
    return db_service.db
