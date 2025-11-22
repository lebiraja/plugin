"""
Service module - provides singleton instances of all services
"""

from .rag_service import RAGService
from .database_service import DatabaseService

# Create singleton instances
rag_service = RAGService()
db_service = DatabaseService()

# Set database reference in RAG service
rag_service.set_db_service(db_service)

__all__ = ["rag_service", "db_service"]
