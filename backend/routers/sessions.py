"""Chat session management: CRUD, messaging (blocking + streaming), file upload."""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import aiofiles
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import settings
from dependencies import (
    get_llm_service,
    get_rag_service,
    get_search_service,
    get_session_service,
)
from errors import NotFoundError, ValidationError
from services.llm_service import LLMService
from services.rag_service import RAGService
from services.search_service import SearchService
from services.session_service import SessionService
from sse import sse_event

logger = logging.getLogger(__name__)
router = APIRouter()


# ── request/response models ───────────────────────────────────────────────────


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
    message: str = Field(..., min_length=1)
    config: Optional[ModelConfig] = None
    tools_enabled: Optional[Dict[str, bool]] = None


class RenameSessionRequest(BaseModel):
    title: str = Field(..., min_length=1)


# ── CRUD ──────────────────────────────────────────────────────────────────────


@router.post("/create", response_model=CreateSessionResponse)
async def create_session(
    request: CreateSessionRequest,
    sessions: SessionService = Depends(get_session_service),
):
    config = request.config.model_dump() if request.config else {}
    return await sessions.create_session(
        backend=request.backend, model=request.model, config=config
    )


@router.get("")
async def list_sessions(
    skip: int = 0,
    limit: int = 50,
    sort: str = "updated_at",
    sessions: SessionService = Depends(get_session_service),
):
    return await sessions.list_sessions(skip=skip, limit=limit, sort_by=sort)


@router.get("/{session_id}")
async def get_session(
    session_id: str, sessions: SessionService = Depends(get_session_service)
):
    session = await sessions.get_session(session_id)
    if not session:
        raise NotFoundError("Session not found")
    return session


@router.patch("/{session_id}/rename")
async def rename_session(
    session_id: str,
    request: RenameSessionRequest,
    sessions: SessionService = Depends(get_session_service),
):
    if not await sessions.rename_session(session_id, request.title):
        raise NotFoundError("Session not found")
    return {"success": True, "title": request.title}


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    sessions: SessionService = Depends(get_session_service),
    rag: RAGService = Depends(get_rag_service),
):
    session = await sessions.get_session(session_id)
    if session:
        for file_meta in session.get("files", []):
            path = file_meta.get("path")
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError as exc:
                    logger.warning("Failed to delete file %s: %s", path, exc)
            if file_meta.get("file_id"):
                await rag.delete_file(file_meta["file_id"])
    if not await sessions.delete_session(session_id):
        raise NotFoundError("Session not found")
    return {"success": True}


@router.post("/{session_id}/generate-title")
async def generate_title(
    session_id: str, sessions: SessionService = Depends(get_session_service)
):
    session = await sessions.get_session(session_id)
    if not session:
        raise NotFoundError("Session not found")
    first_user = next(
        (m["content"] for m in session.get("messages", []) if m["role"] == "user"), None
    )
    if not first_user:
        raise ValidationError("No user message to derive a title from")
    title = await sessions.generate_title(session_id, first_user)
    return {"title": title}


# ── messaging ─────────────────────────────────────────────────────────────────


async def _build_context(
    request: SendMessageRequest,
    session: Dict[str, Any],
    rag: RAGService,
    search: SearchService,
) -> Tuple[str, List[Dict], List[Dict]]:
    """Assemble RAG + web-search context and the enhanced prompt for a message."""
    tools = request.tools_enabled or {}
    context_text = ""
    rag_results: List[Dict] = []
    search_results: List[Dict] = []

    if tools.get("rag") and session.get("files"):
        file_ids = [f["file_id"] for f in session["files"]]
        rag_results = await rag.query(request.message, file_ids, top_k=3)
        if rag_results:
            context_text += "\n\n--- Retrieved Context ---\n"
            for idx, r in enumerate(rag_results):
                context_text += f"[{idx + 1}] From {r.get('source', 'unknown')}:\n{r.get('content', '')}\n\n"

    if tools.get("web_search"):
        search_results = await search.search(request.message, max_results=5)
        if search_results:
            context_text += "\n\n--- Web Search Results ---\n"
            for idx, r in enumerate(search_results):
                context_text += f"Source [{idx + 1}]: {r.get('title', '')}\nURL: {r.get('url', '')}\n"
                content = r.get("content") or r.get("snippet", "")
                if content:
                    context_text += f"Content: {content}\n\n"

    prompt = request.message
    if context_text:
        prompt = f"""You are a helpful AI assistant. Use the following context to answer the user's question accurately.

{context_text}
--- User Question ---
{request.message}

IMPORTANT:
- Answer based on the context provided above
- Cite sources using [1], [2], etc. when referencing information
- If the context doesn't contain enough information, say so clearly
- Be specific and factual"""

    return prompt, rag_results, search_results


def _history(session: Dict[str, Any]) -> List[Dict[str, str]]:
    return [
        {"role": m["role"], "content": m["content"]}
        for m in session.get("messages", [])[-10:]
    ]


def _assistant_message(
    content: str,
    tokens: Dict[str, int],
    latency: float,
    rag_results: List[Dict],
    search_results: List[Dict],
) -> Dict[str, Any]:
    message: Dict[str, Any] = {
        "role": "assistant",
        "content": content,
        "tokens": tokens,
        "latency": latency,
        "tools_used": {
            "web_search": bool(search_results),
            "rag": bool(rag_results),
            "deep_research": False,
        },
    }
    if search_results:
        message["citations"] = [
            {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("snippet", "")}
            for r in search_results
        ]
    if rag_results:
        message["retrieved_context"] = [
            {"source": r.get("source", ""), "content": r.get("content", ""), "similarity": r.get("similarity", 0)}
            for r in rag_results
        ]
    return message


async def _maybe_generate_title(
    session: Dict[str, Any],
    user_message: str,
    assistant_content: str,
    sessions: SessionService,
) -> None:
    """Kick off title generation in the background after the first exchange."""
    if session["metadata"]["total_messages"] == 0:
        import asyncio

        asyncio.create_task(
            sessions.generate_title(
                session["session_id"],
                user_message,
                assistant_content,
                session["model_config"]["backend"],
                session["model_config"]["model"],
            )
        )


@router.post("/{session_id}/message")
async def send_message(
    session_id: str,
    request: SendMessageRequest,
    sessions: SessionService = Depends(get_session_service),
    llm: LLMService = Depends(get_llm_service),
    rag: RAGService = Depends(get_rag_service),
    search: SearchService = Depends(get_search_service),
):
    """Send a message and get the complete assistant response."""
    session = await sessions.get_session(session_id)
    if not session:
        raise NotFoundError("Session not found")

    await sessions.add_message(session_id, {"role": "user", "content": request.message, "files": []})

    prompt, rag_results, search_results = await _build_context(request, session, rag, search)
    config = request.config.model_dump() if request.config else session["model_config"]

    start = datetime.utcnow()
    response = await llm.generate_response(
        message=prompt,
        backend=session["model_config"]["backend"],
        model=session["model_config"]["model"],
        config=config,
        history=_history(session),
    )
    latency = (datetime.utcnow() - start).total_seconds() * 1000

    assistant = _assistant_message(
        response.get("content", ""), response.get("tokens", {}), latency, rag_results, search_results
    )
    await sessions.add_message(session_id, assistant)
    await _maybe_generate_title(session, request.message, assistant["content"], sessions)
    return assistant


@router.post("/{session_id}/message/stream")
async def stream_message(
    session_id: str,
    request: SendMessageRequest,
    sessions: SessionService = Depends(get_session_service),
    llm: LLMService = Depends(get_llm_service),
    rag: RAGService = Depends(get_rag_service),
    search: SearchService = Depends(get_search_service),
):
    """Stream the assistant response token-by-token (SSE), persisting at the end."""
    session = await sessions.get_session(session_id)
    if not session:
        raise NotFoundError("Session not found")

    await sessions.add_message(session_id, {"role": "user", "content": request.message, "files": []})
    prompt, rag_results, search_results = await _build_context(request, session, rag, search)
    config = request.config.model_dump() if request.config else session["model_config"]

    async def generate():
        start = datetime.utcnow()
        parts: List[str] = []
        tokens: Dict[str, int] = {"prompt": 0, "completion": 0, "total": 0}

        # Tell the client up front which tools contributed context.
        yield sse_event(
            {"type": "meta", "rag": bool(rag_results), "web_search": bool(search_results)}
        )

        async for event in llm.stream_chat(
            message=prompt,
            backend=session["model_config"]["backend"],
            model=session["model_config"]["model"],
            config=config,
            history=_history(session),
        ):
            if event["type"] == "token":
                parts.append(event["content"])
                yield sse_event({"type": "token", "content": event["content"]})
            elif event["type"] == "done":
                tokens = event.get("tokens", tokens)

        latency = (datetime.utcnow() - start).total_seconds() * 1000
        assistant = _assistant_message("".join(parts), tokens, latency, rag_results, search_results)
        await sessions.add_message(session_id, assistant)
        await _maybe_generate_title(session, request.message, assistant["content"], sessions)
        yield sse_event(
            {
                "type": "done",
                "message_id": assistant["message_id"],
                "tokens": tokens,
                "latency": latency,
                "citations": assistant.get("citations", []),
                "retrieved_context": assistant.get("retrieved_context", []),
            }
        )

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── file upload ───────────────────────────────────────────────────────────────


@router.post("/{session_id}/upload")
async def upload_file_to_session(
    session_id: str,
    file: UploadFile = File(...),
    sessions: SessionService = Depends(get_session_service),
    rag: RAGService = Depends(get_rag_service),
):
    """Upload a file to a session and embed it for RAG."""
    session = await sessions.get_session(session_id)
    if not session:
        raise NotFoundError("Session not found")

    session_dir = os.path.join(settings.upload_dir, session_id)
    os.makedirs(session_dir, exist_ok=True)
    file_path = os.path.join(session_dir, file.filename)

    content = await file.read()
    if len(content) > settings.max_file_size:
        raise ValidationError(
            f"File exceeds the {settings.max_file_size // (1024 * 1024)}MB limit."
        )
    async with aiofiles.open(file_path, "wb") as buffer:
        await buffer.write(content)

    stored = await sessions.add_file_to_session(
        session_id,
        {
            "filename": file.filename,
            "path": file_path,
            "type": file.content_type or "unknown",
            "size": len(content),
            "embedded": False,
            "chunks": 0,
        },
    )
    if not stored:
        raise NotFoundError("Session not found")

    file_id = stored["file_id"]
    try:
        chunks = await rag.add_document(file_path, file_id, session_id)
        await sessions.update_file_metadata(
            session_id, file_id, {"embedded": True, "chunks": chunks}
        )
        stored["embedded"] = True
        stored["chunks"] = chunks
        logger.info("Embedded %s for session %s (%d chunks)", file.filename, session_id, chunks)
    except Exception:
        logger.exception("Failed to embed %s for RAG", file.filename)

    return stored
