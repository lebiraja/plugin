"""
Session service for CRUD operations on chat sessions
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4
import logging

from services.database_service import db_service
from services.llm_service import LLMService, _default_llm_service

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing chat sessions in MongoDB"""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or _default_llm_service()

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
        """Add a message and update all derived metadata in a single DB write."""
        message["message_id"] = str(uuid4())
        message["timestamp"] = datetime.utcnow()

        set_fields: Dict[str, Any] = {"updated_at": datetime.utcnow()}
        inc_fields: Dict[str, Any] = {"metadata.total_messages": 1}

        if message["role"] == "assistant":
            set_fields["metadata.last_message_preview"] = message["content"][:100]

        if message.get("tokens"):
            inc_fields["metadata.total_tokens"] = message["tokens"].get("total", 0)

        tools = message.get("tools_used") or {}
        for tool in ("web_search", "rag", "deep_research"):
            if tools.get(tool):
                inc_fields[f"metadata.tools_usage_count.{tool}"] = 1

        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {"$push": {"messages": message}, "$set": set_fields, "$inc": inc_fields},
        )
        if result.modified_count == 0:
            raise ValueError(f"Session {session_id} not found")

        return message

    async def generate_title(
        self,
        session_id: str,
        user_message: str,
        assistant_response: str = "",
        backend: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        """
        Auto-generate a session title.

        ``backend``/``model`` are optional: when omitted (e.g. the manual
        generate-title endpoint passes only the user message) they are read from
        the session's stored model_config, so both call sites work with one
        signature.
        """
        try:
            if backend is None or model is None:
                session = await self.get_session(session_id)
                if not session:
                    raise ValueError(f"Session {session_id} not found")
                backend = backend or session["model_config"]["backend"]
                model = model or session["model_config"]["model"]

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
    ) -> Optional[Dict[str, Any]]:
        """Add file metadata to a session; return the stored record (with file_id)."""
        file_metadata["file_id"] = str(uuid4())
        file_metadata["uploaded_at"] = datetime.utcnow()

        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {
                "$push": {"files": file_metadata},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )
        return file_metadata if result.modified_count > 0 else None

    async def update_model_config(
        self, session_id: str, backend: str, model: str
    ) -> bool:
        """Update the session's backend/model (e.g. when first selected)."""
        result = await db_service.sessions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "model_config.backend": backend,
                    "model_config.model": model,
                    "updated_at": datetime.utcnow(),
                }
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
