"""
Service singletons.

``db_service`` is light and always available. ``rag_service`` pulls in heavy ML
dependencies (sentence-transformers, torch), so it is constructed lazily on
first access — importing this package for the chat/session paths must not pay
the embedding-model cost.
"""

from typing import TYPE_CHECKING

from .database_service import db_service

if TYPE_CHECKING:
    from .rag_service import RAGService

_rag_service = None


def __getattr__(name: str):
    if name == "rag_service":
        global _rag_service
        if _rag_service is None:
            from .rag_service import RAGService

            _rag_service = RAGService()
        return _rag_service
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["db_service", "rag_service"]
