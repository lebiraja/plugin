"""
FastAPI router for chat session management
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import shutil
import logging

from services.session_service import SessionService
from services.llm_service import LLMService
from services import rag_service
from services.search_service import SearchService
from config import settings

router = APIRouter()
session_service = SessionService()
llm_service = LLMService()
# Use singleton rag_service from services module
search_service = SearchService()

logger = logging.getLogger(__name__)


# Pydantic Models
class ModelConfig(BaseModel):
    temperature: float = 0.7
    topP: float = 0.9
    maxTokens: int = 2048
    frequencyPenalty: float = 0.0
    presencePenalty: float = 0.0


class CreateSessionRequest(BaseModel):
    backend: str
    model: str
    config: Optional[ModelConfig] = None


class CreateSessionResponse(BaseModel):
    session_id: str
    title: str


class SendMessageRequest(BaseModel):
    message: str
    config: Optional[ModelConfig] = None
    tools_enabled: Optional[Dict[str, bool]] = None


class RenameSessionRequest(BaseModel):
    title: str


@router.post("/create", response_model=CreateSessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new chat session"""
    try:
        config = request.config.dict() if request.config else {}
        result = await session_service.create_session(
            backend=request.backend, model=request.model, config=config
        )
        return result
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def list_sessions(skip: int = 0, limit: int = 50, sort: str = "updated_at"):
    """Get list of all sessions with pagination"""
    try:
        result = await session_service.list_sessions(
            skip=skip, limit=limit, sort_by=sort
        )
        return result
    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}")
async def get_session(session_id: str):
    """Get a single session by ID"""
    try:
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/message")
async def send_message(session_id: str, request: SendMessageRequest):
    """Send a message in a session and get LLM response"""
    try:
        # Verify session exists
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Add user message
        user_message = {
            "role": "user",
            "content": request.message,
            "files": [],
        }
        await session_service.add_message(session_id, user_message)

        # Prepare context
        tools_enabled = request.tools_enabled or {}
        context_text = ""
        rag_results = []
        search_results = []

        # RAG query if enabled
        if tools_enabled.get("rag") and session.get("files"):
            file_ids = [f["file_id"] for f in session["files"]]
            rag_results = await rag_service.query(request.message, file_ids, top_k=3)
            if rag_results:
                context_text += "\n\n--- Retrieved Context ---\n"
                for idx, result in enumerate(rag_results):
                    context_text += f"[{idx + 1}] From {result.get('source', 'unknown')}:\n{result.get('content', '')}\n\n"

        # Web search if enabled
        if tools_enabled.get("web_search"):
            search_results = await search_service.search(request.message, max_results=5)
            if search_results:
                context_text += "\n\n--- Web Search Results ---\n"
                for idx, result in enumerate(search_results):
                    context_text += f"Source [{idx + 1}]: {result.get('title', '')}\n"
                    context_text += f"URL: {result.get('url', '')}\n"
                    content = result.get("content") or result.get("snippet", "")
                    if content:
                        context_text += f"Content: {content}\n\n"

        # Build enhanced prompt
        enhanced_prompt = request.message
        if context_text:
            enhanced_prompt = f"""You are a helpful AI assistant. Use the following context to answer the user's question accurately.

{context_text}
--- User Question ---
{request.message}

IMPORTANT:
- Answer based on the context provided above
- Cite sources using [1], [2], etc. when referencing information
- If the context doesn't contain enough information, say so clearly
- Be specific and factual"""

        # Get conversation history
        messages = session.get("messages", [])
        history = [{"role": m["role"], "content": m["content"]} for m in messages[-10:]]

        # Generate LLM response
        start_time = datetime.utcnow()
        config = request.config.dict() if request.config else session["model_config"]

        # Log request details for debugging
        logger.info(
            f"Generating response with backend={session['model_config']['backend']}, model={session['model_config']['model']}"
        )

        response = await llm_service.generate_response(
            message=enhanced_prompt,
            backend=session["model_config"]["backend"],
            model=session["model_config"]["model"],
            config=config,
            history=history,
        )

        latency = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Prepare assistant message
        assistant_message = {
            "role": "assistant",
            "content": response.get("content", ""),
            "tokens": response.get("tokens"),
            "latency": latency,
            "tools_used": {
                "web_search": bool(search_results),
                "rag": bool(rag_results),
                "deep_research": False,
            },
        }

        # Add citations if available
        if search_results:
            assistant_message["citations"] = [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("snippet", ""),
                }
                for r in search_results
            ]

        # Add retrieved context if available
        if rag_results:
            assistant_message["retrieved_context"] = [
                {
                    "source": r.get("source", ""),
                    "content": r.get("content", ""),
                    "similarity": r.get("similarity", 0),
                }
                for r in rag_results
            ]

        # Save assistant message
        await session_service.add_message(session_id, assistant_message)

        # Generate title AFTER first exchange (user + assistant messages)
        if session["metadata"]["total_messages"] == 0:
            # Run title generation in background (don't wait for it)
            import asyncio

            asyncio.create_task(
                session_service.generate_title(
                    session_id,
                    request.message,
                    assistant_message["content"],
                    session["model_config"]["backend"],
                    session["model_config"]["model"],
                )
            )

        return assistant_message

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/generate-title")
async def generate_title(session_id: str):
    """Auto-generate title for session from first message"""
    try:
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = session.get("messages", [])
        if not messages:
            raise HTTPException(status_code=400, detail="No messages in session")

        first_message = next(
            (m["content"] for m in messages if m["role"] == "user"), None
        )
        if not first_message:
            raise HTTPException(status_code=400, detail="No user message found")

        title = await session_service.generate_title(session_id, first_message)
        return {"title": title}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate title: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{session_id}/rename")
async def rename_session(session_id: str, request: RenameSessionRequest):
    """Rename a session"""
    try:
        success = await session_service.rename_session(session_id, request.title)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"success": True, "title": request.title}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rename session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and its associated files"""
    try:
        # Get session to find files
        session = await session_service.get_session(session_id)
        if session:
            # Delete files from disk
            for file_meta in session.get("files", []):
                file_path = file_meta.get("path")
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        logger.warning(f"Failed to delete file {file_path}: {e}")

        # Delete session from database
        success = await session_service.delete_session(session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/upload")
async def upload_file_to_session(session_id: str, file: UploadFile = File(...)):
    """Upload a file to a session and process it for RAG"""
    try:
        # Verify session exists
        session = await session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Create session-specific upload directory
        session_upload_dir = os.path.join(settings.upload_dir, session_id)
        os.makedirs(session_upload_dir, exist_ok=True)

        # Save file
        file_path = os.path.join(session_upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(file_path)

        # Prepare file metadata
        file_metadata = {
            "filename": file.filename,
            "path": file_path,
            "type": file.content_type or "unknown",
            "size": file_size,
            "embedded": False,
            "chunks": 0,
        }

        # Add to session (this will generate file_id)
        await session_service.add_file_to_session(session_id, file_metadata)

        # Get the session again to retrieve the file_id
        updated_session = await session_service.get_session(session_id)
        uploaded_file = None
        for f in updated_session.get("files", []):
            if f["filename"] == file.filename and f["path"] == file_path:
                uploaded_file = f
                break

        if not uploaded_file:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve uploaded file"
            )

        file_id = uploaded_file["file_id"]

        # Process file with RAG service
        try:
            chunks_created = await rag_service.add_document(
                file_path, file_id, session_id
            )

            # Update file metadata with embedding info
            await session_service.update_file_metadata(
                session_id, file_id, {"embedded": True, "chunks": chunks_created}
            )

            uploaded_file["embedded"] = True
            uploaded_file["chunks"] = chunks_created

            logger.info(
                f"File processed for session {session_id}: {file.filename} ({chunks_created} chunks)"
            )

        except Exception as e:
            logger.error(f"Failed to process file for RAG: {e}")
            # File is uploaded but not embedded - user can still see it

        logger.info(f"File uploaded to session {session_id}: {file.filename}")

        return uploaded_file

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
