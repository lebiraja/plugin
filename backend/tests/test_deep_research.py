"""Deep research: request-local counters, serialization, persistence."""

import asyncio
from datetime import datetime

import pytest

from services.deep_research_service import (
    DeepResearchService,
    Evidence,
    FinalReport,
    ResearchMetadata,
    ResearchPlan,
    ResearchResult,
    ReasoningStep,
    _Counters,
    _counters,
    _deserialize_result,
    _serialize_result,
)


def _sample_result() -> ResearchResult:
    return ResearchResult(
        research_id="abc123",
        query="q",
        plan=ResearchPlan(
            main_question="m",
            sub_questions=["a"],
            search_queries=["s"],
            required_depth=2,
            focus_areas=["f"],
        ),
        evidence=[
            Evidence(
                source_url="u",
                title="t",
                snippet="sn",
                content="c",
                relevance_score=0.5,
                quality_score=0.6,
                extraction_time=datetime.now(),
                word_count=10,
            )
        ],
        reasoning_trace=[
            ReasoningStep(
                step=1,
                question="q",
                sources_consulted=["u"],
                finding="found it",
                confidence=0.8,
            )
        ],
        final_report=FinalReport(
            executive_summary="es",
            detailed_findings=[],
            insights=["i"],
            recommendations=["r"],
            caveats=["c"],
        ),
        citations=[{"id": "1", "title": "t", "url": "u", "accessed": "2026-06-02"}],
        metadata=ResearchMetadata(
            time_taken=1.0,
            tokens_used=5,
            searches_performed=1,
            sources_scraped=1,
            llm_calls=2,
        ),
    )


def test_serialize_deserialize_round_trip():
    original = _sample_result()
    rebuilt = _deserialize_result(_serialize_result(original))
    assert rebuilt.research_id == "abc123"
    assert rebuilt.evidence[0].title == "t"
    assert rebuilt.reasoning_trace[0].finding == "found it"
    assert rebuilt.metadata.llm_calls == 2


def test_track_updates_request_local_counters():
    svc = DeepResearchService.__new__(DeepResearchService)
    token = _counters.set(_Counters())
    try:
        svc._track({"tokens": {"total": 10}})
        svc._track({"tokens": {"total": 5}})
        counters = _counters.get()
        assert counters.llm_calls == 2
        assert counters.tokens_used == 15
    finally:
        _counters.reset(token)


def test_parse_json_block_handles_fences():
    assert DeepResearchService._parse_json_block('```json\n{"a": 1}\n```') == {"a": 1}
    assert DeepResearchService._parse_json_block('{"b": 2}') == {"b": 2}


@pytest.mark.asyncio
async def test_persist_and_load_round_trip(mock_db):
    from services.database_service import db_service

    svc = DeepResearchService(db_service=db_service)
    result = _sample_result()
    await svc._persist(result)

    # Drop the in-memory cache so we read back from Mongo.
    svc._memory_cache.clear()
    loaded = await svc.get_cached_research("abc123")
    assert loaded is not None
    assert loaded.query == "q"
    assert loaded.evidence[0].title == "t"


@pytest.mark.asyncio
async def test_counters_isolated_across_concurrent_tasks():
    svc = DeepResearchService.__new__(DeepResearchService)

    async def run(n):
        token = _counters.set(_Counters())
        try:
            for _ in range(n):
                svc._track({"tokens": {"total": 1}})
            await asyncio.sleep(0)
            return _counters.get().llm_calls
        finally:
            _counters.reset(token)

    results = await asyncio.gather(run(3), run(5), run(2))
    assert sorted(results) == [2, 3, 5]
