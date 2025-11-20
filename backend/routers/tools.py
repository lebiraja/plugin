from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

from services.search_service import SearchService
from services.rag_service import RAGService

router = APIRouter()
search_service = SearchService()
rag_service = RAGService()


class SearchRequest(BaseModel):
    query: str
    max_results: int = 5


class RAGQueryRequest(BaseModel):
    query: str
    file_ids: List[str] = []
    top_k: int = 3


@router.post("/search")
async def web_search(request: SearchRequest):
    """Perform a web search"""
    try:
        results = await search_service.search(request.query, request.max_results)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query")
async def rag_query(request: RAGQueryRequest):
    """Query RAG system"""
    try:
        results = await rag_service.query(
            query=request.query,
            file_ids=request.file_ids,
            top_k=request.top_k,
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
