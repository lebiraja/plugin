"""Stateless chat endpoints (not tied to a persisted session)."""

from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from dependencies import get_llm_service
from services.llm_service import LLMService
from sse import sse_event

router = APIRouter()


class ModelConfig(BaseModel):
    temperature: float = 0.7
    topP: float = 0.9
    maxTokens: int = 2048
    frequencyPenalty: float = 0.0
    presencePenalty: float = 0.0


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    backend: str
    model: str
    config: ModelConfig
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    content: str
    tokens: Optional[Dict[str, int]] = None
    model: Optional[str] = None
    backend: Optional[str] = None


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest, llm: LLMService = Depends(get_llm_service)
):
    """Send a message and get a complete response."""
    history = [msg.model_dump() for msg in request.history]
    return await llm.generate_response(
        message=request.message,
        backend=request.backend,
        model=request.model,
        config=request.config.model_dump(),
        history=history,
    )


@router.post("/stream")
async def stream_message(
    request: ChatRequest, llm: LLMService = Depends(get_llm_service)
):
    """Stream a response token-by-token as Server-Sent Events."""
    history = [msg.model_dump() for msg in request.history]

    async def generate():
        async for event in llm.stream_chat(
            message=request.message,
            backend=request.backend,
            model=request.model,
            config=request.config.model_dump(),
            history=history,
        ):
            yield sse_event(event)

    return StreamingResponse(generate(), media_type="text/event-stream")
