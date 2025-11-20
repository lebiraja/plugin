from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from fastapi.responses import StreamingResponse
import asyncio

from services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()


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
    message: str
    backend: str
    model: str
    config: ModelConfig
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    content: str
    tokens: Optional[Dict[str, int]] = None
    model: Optional[str] = None
    backend: Optional[str] = None


@router.post("/", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send a message and get a response from the LLM"""
    try:
        # Convert history to dict format
        history_dicts = [msg.dict() for msg in request.history]
        
        response = await llm_service.generate_response(
            message=request.message,
            backend=request.backend,
            model=request.model,
            config=request.config.dict(),
            history=history_dicts,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_message(request: ChatRequest):
    """Stream a response from the LLM"""
    try:
        async def generate():
            async for chunk in llm_service.stream_response(
                message=request.message,
                backend=request.backend,
                model=request.model,
                config=request.config.dict(),
            ):
                yield chunk

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
