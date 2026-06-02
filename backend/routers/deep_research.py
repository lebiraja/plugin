"""
Deep Research Router - API endpoints for comprehensive research operations
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging

from dependencies import get_deep_research_service
from errors import NotFoundError
from services.deep_research_service import DeepResearchService, ResearchResult
from sse import sse_event

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class DeepResearchRequest(BaseModel):
    """Request to conduct deep research"""

    query: str = Field(..., min_length=5, description="Research question")
    backend: str = Field(..., description="LLM backend (ollama/lmstudio)")
    model: str = Field(..., description="Model name")
    max_depth: int = Field(default=2, ge=1, le=3, description="Research depth (1-3)")
    max_sources: int = Field(
        default=15, ge=5, le=30, description="Max sources to consult"
    )


class ResearchPlanResponse(BaseModel):
    """Research plan details"""

    main_question: str
    sub_questions: List[str]
    search_queries: List[str]
    focus_areas: List[str]
    required_depth: int


class EvidenceResponse(BaseModel):
    """Single evidence source"""

    source_url: str
    title: str
    snippet: str
    relevance_score: float
    quality_score: float
    word_count: int


class ReasoningStepResponse(BaseModel):
    """Single reasoning step"""

    step: int
    question: str
    finding: str
    confidence: float
    contradictions: List[str]


class FinalReportResponse(BaseModel):
    """Final research report"""

    executive_summary: str
    insights: List[str]
    recommendations: List[str]
    caveats: List[str]


class ResearchMetadataResponse(BaseModel):
    """Research execution metadata"""

    time_taken: float
    tokens_used: int
    searches_performed: int
    sources_scraped: int
    llm_calls: int
    cache_hits: int


class DeepResearchResponse(BaseModel):
    """Complete deep research result"""

    research_id: str
    query: str
    plan: ResearchPlanResponse
    evidence_count: int
    top_evidence: List[EvidenceResponse]
    reasoning_trace: List[ReasoningStepResponse]
    final_report: FinalReportResponse
    citations: List[dict]
    metadata: ResearchMetadataResponse
    created_at: datetime


class ResearchStatusResponse(BaseModel):
    """Research status check"""

    research_id: str
    status: str  # "in_progress", "completed", "cached"
    progress: Optional[str] = None


# Endpoints
@router.post("/conduct", response_model=DeepResearchResponse)
async def conduct_deep_research(
    request: DeepResearchRequest,
    service: DeepResearchService = Depends(get_deep_research_service),
):
    """Run the full multi-stage research pipeline and return the report."""
    result: ResearchResult = await service.conduct_research(
        query=request.query,
        backend=request.backend,
        model=request.model,
        max_depth=request.max_depth,
        max_sources=request.max_sources,
    )
    return _convert_to_response(result)


@router.post("/conduct/stream")
async def conduct_deep_research_stream(
    request: DeepResearchRequest,
    service: DeepResearchService = Depends(get_deep_research_service),
):
    """Run research, streaming stage progress then the final result as SSE."""

    async def generate():
        async for event in service.conduct_research_streaming(
            query=request.query,
            backend=request.backend,
            model=request.model,
            max_depth=request.max_depth,
            max_sources=request.max_sources,
        ):
            if event["stage"] in ("complete", "cached"):
                yield sse_event(
                    {
                        "stage": event["stage"],
                        "progress": event.get("progress", 100),
                        "result": _convert_to_response(event["result"]).model_dump(),
                    }
                )
            else:
                yield sse_event(event)

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/status/{research_id}", response_model=ResearchStatusResponse)
async def get_research_status(
    research_id: str,
    service: DeepResearchService = Depends(get_deep_research_service),
):
    """Check whether a research result is persisted/cached."""
    cached = await service.get_cached_research(research_id)
    if cached:
        return ResearchStatusResponse(
            research_id=research_id,
            status="cached",
            progress=f"Completed at {cached.created_at.isoformat()}",
        )
    return ResearchStatusResponse(
        research_id=research_id, status="not_found", progress="Not found"
    )


@router.get("/cache/stats")
async def get_cache_stats(
    service: DeepResearchService = Depends(get_deep_research_service),
):
    """List persisted research summaries."""
    cached = await service.list_cached()
    return {"cache_size": len(cached), "cached_research": cached}


@router.delete("/cache/clear")
async def clear_cache(
    service: DeepResearchService = Depends(get_deep_research_service),
):
    """Clear all persisted research results."""
    cleared = await service.clear_cache()
    return {
        "success": True,
        "cleared_count": cleared,
        "message": f"Cleared {cleared} cached research results",
    }


# Helper Functions
def _convert_to_response(result: ResearchResult) -> DeepResearchResponse:
    """Convert ResearchResult to API response model"""

    # Convert plan
    plan_response = ResearchPlanResponse(
        main_question=result.plan.main_question,
        sub_questions=result.plan.sub_questions,
        search_queries=result.plan.search_queries,
        focus_areas=result.plan.focus_areas,
        required_depth=result.plan.required_depth,
    )

    # Convert top 5 evidence sources
    top_evidence = [
        EvidenceResponse(
            source_url=e.source_url,
            title=e.title,
            snippet=e.snippet,
            relevance_score=e.relevance_score,
            quality_score=e.quality_score,
            word_count=e.word_count,
        )
        for e in result.evidence[:5]
    ]

    # Convert reasoning trace
    reasoning_response = [
        ReasoningStepResponse(
            step=step.step,
            question=step.question,
            finding=step.finding,
            confidence=step.confidence,
            contradictions=step.contradictions,
        )
        for step in result.reasoning_trace
    ]

    # Convert final report
    report_response = FinalReportResponse(
        executive_summary=result.final_report.executive_summary,
        insights=result.final_report.insights,
        recommendations=result.final_report.recommendations,
        caveats=result.final_report.caveats,
    )

    # Convert metadata
    metadata_response = ResearchMetadataResponse(
        time_taken=result.metadata.time_taken,
        tokens_used=result.metadata.tokens_used,
        searches_performed=result.metadata.searches_performed,
        sources_scraped=result.metadata.sources_scraped,
        llm_calls=result.metadata.llm_calls,
        cache_hits=result.metadata.cache_hits,
    )

    return DeepResearchResponse(
        research_id=result.research_id,
        query=result.query,
        plan=plan_response,
        evidence_count=len(result.evidence),
        top_evidence=top_evidence,
        reasoning_trace=reasoning_response,
        final_report=report_response,
        citations=result.citations,
        metadata=metadata_response,
        created_at=result.created_at,
    )
