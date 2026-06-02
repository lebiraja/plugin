"""Standalone tool endpoints: web search and RAG query."""

from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from dependencies import get_rag_service, get_search_service
from services.rag_service import RAGService
from services.search_service import SearchService

router = APIRouter()


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    max_results: int = 5
    scrape_content: bool = True


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    file_ids: List[str] = []
    top_k: int = 3


@router.post("/search")
async def web_search(
    request: SearchRequest, search: SearchService = Depends(get_search_service)
):
    """Web search with optional content scraping."""
    results = await search.search(
        request.query, request.max_results, request.scrape_content
    )
    return {"results": results}


@router.post("/rag/query")
async def rag_query(
    request: RAGQueryRequest, rag: RAGService = Depends(get_rag_service)
):
    """Query the RAG vector store."""
    results = await rag.query(
        query=request.query, file_ids=request.file_ids, top_k=request.top_k
    )
    return {"results": results}
