"""
Deep Research Router - API endpoints for comprehensive research operations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging

from services.deep_research_service import DeepResearchService, ResearchResult

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize deep research service
deep_research_service = DeepResearchService()


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
async def conduct_deep_research(request: DeepResearchRequest):
    """
    Conduct comprehensive deep research on a query.

    This endpoint performs multi-stage research:
    1. Generate research plan (sub-questions, search queries)
    2. Multi-level search and evidence collection
    3. Multi-hop reasoning across sources
    4. Report synthesis with citations

    Returns complete research results with structured report.
    """
    try:
        logger.info(f"🔬 Deep research request: {request.query}")

        # Conduct research
        result: ResearchResult = await deep_research_service.conduct_research(
            query=request.query,
            backend=request.backend,
            model=request.model,
            max_depth=request.max_depth,
            max_sources=request.max_sources,
        )

        # Convert to response model
        response = _convert_to_response(result)

        logger.info(f"✅ Research completed: {result.research_id}")
        return response

    except Exception as e:
        logger.error(f"❌ Deep research failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.get("/status/{research_id}", response_model=ResearchStatusResponse)
async def get_research_status(research_id: str):
    """
    Check status of a research operation.

    Returns whether research is cached, in progress, or needs to be started.
    """
    try:
        cached_result = deep_research_service.get_cached_research(research_id)

        if cached_result:
            return ResearchStatusResponse(
                research_id=research_id,
                status="cached",
                progress=f"Completed at {cached_result.created_at.isoformat()}",
            )
        else:
            return ResearchStatusResponse(
                research_id=research_id,
                status="not_found",
                progress="Research not found in cache",
            )

    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get cache statistics.

    Returns information about cached research results.
    """
    try:
        cache_size = len(deep_research_service.research_cache)

        cached_queries = [
            {
                "research_id": rid,
                "query": result.query,
                "created_at": result.created_at.isoformat(),
                "sources": len(result.evidence),
                "cache_hits": result.metadata.cache_hits,
            }
            for rid, result in deep_research_service.research_cache.items()
        ]

        return {
            "cache_size": cache_size,
            "cached_research": cached_queries,
        }

    except Exception as e:
        logger.error(f"Cache stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache/clear")
async def clear_cache():
    """
    Clear the research cache.

    Removes all cached research results.
    """
    try:
        cache_size_before = len(deep_research_service.research_cache)
        deep_research_service.research_cache.clear()

        return {
            "success": True,
            "cleared_count": cache_size_before,
            "message": f"Cleared {cache_size_before} cached research results",
        }

    except Exception as e:
        logger.error(f"Cache clear failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
