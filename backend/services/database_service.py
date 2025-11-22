"""
MongoDB database service for managing chat sessions
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from typing import Optional
import logging

from config import settings

logger = logging.getLogger(__name__)


class DatabaseService:
    """Singleton service for MongoDB connection"""

    _instance: Optional["DatabaseService"] = None
    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def connect(self):
        """Initialize MongoDB connection and create indexes"""
        try:
            self._client = AsyncIOMotorClient(settings.mongodb_url)
            self._db = self._client[settings.mongodb_db_name]

            # Test connection
            await self._client.admin.command("ping")
            logger.info(f"Connected to MongoDB: {settings.mongodb_db_name}")

            # Create indexes
            await self._create_indexes()

        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    async def disconnect(self):
        """Close MongoDB connection"""
        if self._client:
            self._client.close()
            logger.info("Disconnected from MongoDB")

    async def _create_indexes(self):
        """Create database indexes for optimal performance"""
        try:
            sessions = self._db.chat_sessions
            knowledge_base = self._db.knowledge_base

            # Sessions indexes
            await sessions.create_index([("session_id", ASCENDING)], unique=True)
            await sessions.create_index([("updated_at", DESCENDING)])
            await sessions.create_index([("created_at", DESCENDING)])
            await sessions.create_index(
                [("user_id", ASCENDING), ("updated_at", DESCENDING)]
            )

            # Knowledge base indexes
            await knowledge_base.create_index([("file_id", ASCENDING)])
            await knowledge_base.create_index([("session_id", ASCENDING)])
            await knowledge_base.create_index([("created_at", DESCENDING)])
            # Compound index for file chunks lookup
            await knowledge_base.create_index(
                [("session_id", ASCENDING), ("file_id", ASCENDING)]
            )

            logger.info("MongoDB indexes created successfully")

        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if self._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db

    @property
    def sessions(self):
        """Get chat_sessions collection"""
        return self.db.chat_sessions

    @property
    def knowledge_base(self):
        """Get knowledge_base collection"""
        return self.db.knowledge_base


# Global instance
db_service = DatabaseService()
