"""
Session service for CRUD operations on chat sessions
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4
import logging

from services.database_service import db_service
from services.llm_service import LLMService

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing chat sessions in MongoDB"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()

    async def create_session(
        self, backend: str, model: str, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new chat session"""
        session_id = str(uuid4())
        now = datetime.utcnow()

        session = {
            "session_id": session_id,
            "title": "New Chat",
            "created_at": now,
            "updated_at": now,
            "model_config": {"backend": backend, "model": model, **config},
            "messages": [],
            "files": [],
            "metadata": {
                "total_messages": 0,
                "total_tokens": 0,
                "tools_usage_count": {
                    "web_search": 0,
                    "rag": 0,
                    "deep_research": 0,
                },
                "last_message_preview": "",
                "is_pinned": False,
                "tags": [],
            },
        }

        await db_service.sessions.insert_one(session)
        logger.info(f"Created session: {session_id}")

        return {"session_id": session_id, "title": "New Chat"}

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a single session by ID"""
        session = await db_service.sessions.find_one(
            {"session_id": session_id}, {"_id": 0}
        )
        return session

    async def list_sessions(
        self, skip: int = 0, limit: int = 50, sort_by: str = "updated_at"
    ) -> Dict[str, Any]:
        """List all sessions with pagination"""
        cursor = (
            db_service.sessions.find({}, {"_id": 0})
            .sort(sort_by, -1)
            .skip(skip)
            .limit(limit)
        )

        sessions = await cursor.to_list(length=limit)

        # Get total count
        total = await db_service.sessions.count_documents({})

        # Return lightweight version for sidebar
        session_list = [
            {
                "session_id": s["session_id"],
                "title": s["title"],
                "last_message_preview": s["metadata"].get("last_message_preview", ""),
                "updated_at": s["updated_at"],
                "message_count": s["metadata"].get("total_messages", 0),
                "total_tokens": s["metadata"].get("total_tokens", 0),
            }
            for s in sessions
        ]

        return {"sessions": session_list, "total": total}

    async def add_message(
        self, session_id: str, message: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a message to a session"""
        message["message_id"] = str(uuid4())
        message["timestamp"] = datetime.utcnow()

        # Update session
        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()},
                "$inc": {"metadata.total_messages": 1},
            },
        )

        if result.modified_count == 0:
            raise ValueError(f"Session {session_id} not found")

        # Update last message preview for assistant messages
        if message["role"] == "assistant":
            preview = message["content"][:100]
            await db_service.sessions.update_one(
                {"session_id": session_id},
                {"$set": {"metadata.last_message_preview": preview}},
            )

        # Update token count if present
        if message.get("tokens"):
            total_tokens = message["tokens"].get("total", 0)
            await db_service.sessions.update_one(
                {"session_id": session_id},
                {"$inc": {"metadata.total_tokens": total_tokens}},
            )

        # Update tool usage count
        if message.get("tools_used"):
            tools = message["tools_used"]
            update_dict = {}
            if tools.get("web_search"):
                update_dict["metadata.tools_usage_count.web_search"] = 1
            if tools.get("rag"):
                update_dict["metadata.tools_usage_count.rag"] = 1
            if tools.get("deep_research"):
                update_dict["metadata.tools_usage_count.deep_research"] = 1

            if update_dict:
                await db_service.sessions.update_one(
                    {"session_id": session_id}, {"$inc": update_dict}
                )

        return message

    async def generate_title(
        self,
        session_id: str,
        user_message: str,
        assistant_response: str,
        backend: str,
        model: str,
    ) -> str:
        """Auto-generate session title from first message exchange"""
        try:
            # Create prompt that analyzes both user question and assistant response
            prompt = f"""Based on this conversation exchange, create a concise title using EXACTLY 3-4 words.

User: {user_message}
Assistant: {assistant_response[:200]}

Title (3-4 words only):"""

            response = await self.llm_service.generate_response(
                message=prompt,
                backend=backend,
                model=model,
                config={"temperature": 0.3, "maxTokens": 20},
                history=[],
            )

            # Clean up the title
            title = response.get("content", "").strip()
            # Remove common prefixes and quotes
            title = (
                title.replace("Title:", "").replace('"', "").replace("'", "").strip()
            )

            # Enforce 3-4 word limit
            words = title.split()[:4]  # Take first 4 words max
            title = " ".join(words)[:50]  # Max 50 chars

            if not title or len(title) < 3:
                # Fallback to first 4 words of user message
                words = user_message.split()[:4]
                title = " ".join(words)[:50].strip()

            # Update session title
            await db_service.sessions.update_one(
                {"session_id": session_id}, {"$set": {"title": title}}
            )

            logger.info(f"Generated title for {session_id}: {title}")
            return title

        except Exception as e:
            logger.error(f"Failed to generate title: {e}")
            # Fallback to first 4 words of user message
            words = user_message.split()[:4]
            title = " ".join(words)[:50].strip()
            await db_service.sessions.update_one(
                {"session_id": session_id}, {"$set": {"title": title}}
            )
            return title

    async def rename_session(self, session_id: str, title: str) -> bool:
        """Rename a session"""
        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"title": title, "updated_at": datetime.utcnow()}},
        )
        return result.modified_count > 0

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        result = await db_service.sessions.delete_one({"session_id": session_id})
        logger.info(f"Deleted session: {session_id}")
        return result.deleted_count > 0

    async def add_file_to_session(
        self, session_id: str, file_metadata: Dict[str, Any]
    ) -> bool:
        """Add file metadata to session"""
        file_metadata["file_id"] = str(uuid4())
        file_metadata["uploaded_at"] = datetime.utcnow()

        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"files": file_metadata},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )
        return result.modified_count > 0

    async def update_file_metadata(
        self, session_id: str, file_id: str, updates: Dict[str, Any]
    ) -> bool:
        """Update file metadata in session"""
        # Build update dict with $ positional operator
        update_dict = {}
        for key, value in updates.items():
            update_dict[f"files.$.{key}"] = value

        result = await db_service.sessions.update_one(
            {"session_id": session_id, "files.file_id": file_id},
            {"$set": update_dict},
        )
        return result.modified_count > 0

    async def get_session_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all messages from a session"""
        session = await self.get_session(session_id)
        if session:
            return session.get("messages", [])
        return []
