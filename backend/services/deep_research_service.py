"""
Deep Research Service - Multi-stage research agent with recursive search,
multi-hop reasoning, and comprehensive report generation.

Features:
- LLM-powered research planning
- Multi-level search orchestration
- Evidence collection and quality scoring
- Multi-hop reasoning and contradiction resolution
- Structured report synthesis with citations
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import hashlib
import json
import logging

from services.llm_service import LLMService
from services.search_service import SearchService

logger = logging.getLogger(__name__)


@dataclass
class ResearchPlan:
    """LLM-generated research plan"""

    main_question: str
    sub_questions: List[str]
    search_queries: List[str]
    required_depth: int
    focus_areas: List[str]
    generated_at: datetime = field(default_factory=datetime.now)


@dataclass
class ContentChunk:
    """Extracted content chunk from a source"""

    text: str
    topic_tags: List[str]
    supports_question: str
    confidence: float


@dataclass
class Evidence:
    """Evidence collected from a single source"""

    source_url: str
    title: str
    snippet: str
    content: str
    relevance_score: float
    quality_score: float
    extraction_time: datetime
    content_chunks: List[ContentChunk] = field(default_factory=list)
    word_count: int = 0


@dataclass
class ReasoningStep:
    """Single step in multi-hop reasoning chain"""

    step: int
    question: str
    sources_consulted: List[str]
    finding: str
    confidence: float
    contradictions: List[str] = field(default_factory=list)


@dataclass
class FinalReport:
    """Synthesized research report"""

    executive_summary: str
    detailed_findings: List[Dict[str, Any]]
    insights: List[str]
    recommendations: List[str]
    caveats: List[str]
    generated_at: datetime = field(default_factory=datetime.now)


@dataclass
class ResearchMetadata:
    """Research execution metadata"""

    time_taken: float
    tokens_used: int
    searches_performed: int
    sources_scraped: int
    llm_calls: int
    cache_hits: int = 0


@dataclass
class ResearchResult:
    """Complete research result"""

    research_id: str
    query: str
    plan: ResearchPlan
    evidence: List[Evidence]
    reasoning_trace: List[ReasoningStep]
    final_report: FinalReport
    citations: List[Dict[str, str]]
    metadata: ResearchMetadata
    created_at: datetime = field(default_factory=datetime.now)


class DeepResearchService:
    """
    Multi-stage research agent that conducts comprehensive research
    using recursive search, multi-hop reasoning, and synthesis.
    """

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        search_service: Optional[SearchService] = None,
        db_service=None,
    ):
        self.llm_service = llm_service or LLMService()
        self.search_service = search_service or SearchService()
        self.db_service = db_service
        self.research_cache: Dict[str, ResearchResult] = {}

        # Configuration
        self.max_searches_per_level = 5
        self.max_sources_per_search = 10
        self.min_quality_threshold = 0.6

    async def conduct_research(
        self,
        query: str,
        backend: str,
        model: str,
        max_depth: int = 2,
        max_sources: int = 15,
    ) -> ResearchResult:
        """
        Conduct comprehensive deep research on a query.

        Args:
            query: Research question
            backend: LLM backend (ollama/lmstudio)
            model: Model name
            max_depth: Maximum research depth levels (1-3)
            max_sources: Maximum number of sources to consult

        Returns:
            Complete research result with report and citations
        """
        start_time = datetime.now()
        logger.info(f"🔬 Starting deep research for: {query}")

        # Generate unique research ID
        research_id = self._generate_research_id(query)

        # Check cache
        if research_id in self.research_cache:
            logger.info(f"✅ Returning cached research for: {query}")
            cached = self.research_cache[research_id]
            cached.metadata.cache_hits += 1
            return cached

        try:
            # Stage 1: Generate Research Plan
            logger.info("📋 Stage 1: Generating research plan...")
            plan = await self._generate_research_plan(query, backend, model, max_depth)

            # Stage 2: Multi-Level Search & Evidence Collection
            logger.info("🔍 Stage 2: Conducting multi-level search...")
            evidence = await self._collect_evidence(
                plan, backend, model, max_sources, max_depth
            )

            # Stage 3: Multi-Hop Reasoning
            logger.info("🧠 Stage 3: Analyzing evidence with multi-hop reasoning...")
            reasoning_trace = await self._multi_hop_reasoning(
                plan, evidence, backend, model
            )

            # Stage 4: Synthesize Final Report
            logger.info("📝 Stage 4: Synthesizing final report...")
            final_report = await self._synthesize_report(
                query, plan, evidence, reasoning_trace, backend, model
            )

            # Stage 5: Extract Citations
            citations = self._extract_citations(evidence)

            # Calculate metadata
            time_taken = (datetime.now() - start_time).total_seconds()
            metadata = ResearchMetadata(
                time_taken=time_taken,
                tokens_used=self.tokens_used,
                searches_performed=len(plan.search_queries),
                sources_scraped=len(evidence),
                llm_calls=self.llm_calls_count,
            )

            # Create result
            result = ResearchResult(
                research_id=research_id,
                query=query,
                plan=plan,
                evidence=evidence,
                reasoning_trace=reasoning_trace,
                final_report=final_report,
                citations=citations,
                metadata=metadata,
            )

            # Cache result
            self.research_cache[research_id] = result

            logger.info(f"✅ Research complete in {time_taken:.2f}s")
            return result

        except Exception as e:
            logger.error(f"❌ Research failed: {e}", exc_info=True)
            raise

    async def _generate_research_plan(
        self, query: str, backend: str, model: str, max_depth: int
    ) -> ResearchPlan:
        """Generate a structured research plan using LLM"""

        planning_prompt = f"""You are a research planning assistant. Given a research question, create a comprehensive research plan.

Research Question: {query}

Generate a research plan with:
1. Main question (reformulated for clarity)
2. 3-5 sub-questions that need to be answered
3. 5-8 specific search queries to find relevant information
4. Key focus areas or topics
5. Required research depth (1-3, where 1=basic, 2=detailed, 3=comprehensive)

Format your response as JSON:
{{
  "main_question": "...",
  "sub_questions": ["...", "...", "..."],
  "search_queries": ["...", "...", "..."],
  "focus_areas": ["...", "..."],
  "required_depth": {max_depth}
}}

Be specific and actionable. Search queries should be concrete and diverse."""

        try:
            response = await self.llm_service.generate_response(
                message=planning_prompt,
                backend=backend,
                model=model,
                config={
                    "temperature": 0.3,  # Lower temp for structured output
                    "max_tokens": 1000,
                },
            )

            self.llm_calls_count += 1
            self.tokens_used += response.get("tokens", {}).get("total", 0)

            # Parse JSON response
            content = response.get("content", "")

            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            plan_data = json.loads(content)

            plan = ResearchPlan(
                main_question=plan_data.get("main_question", query),
                sub_questions=plan_data.get("sub_questions", []),
                search_queries=plan_data.get("search_queries", [query]),
                required_depth=plan_data.get("required_depth", max_depth),
                focus_areas=plan_data.get("focus_areas", []),
            )

            logger.info(
                f"📋 Generated plan with {len(plan.sub_questions)} sub-questions"
            )
            return plan

        except Exception as e:
            logger.warning(f"Failed to generate structured plan: {e}, using fallback")
            # Fallback to basic plan
            return ResearchPlan(
                main_question=query,
                sub_questions=[query],
                search_queries=[query],
                required_depth=1,
                focus_areas=[],
            )

    async def _collect_evidence(
        self,
        plan: ResearchPlan,
        backend: str,
        model: str,
        max_sources: int,
        max_depth: int,
    ) -> List[Evidence]:
        """
        Collect evidence through multi-level search.

        Level 1: Execute all planned search queries
        Level 2: Identify gaps and search for missing info
        Level 3: Deep dive into specific areas (if max_depth=3)
        """

        all_evidence = []
        seen_urls = set()

        # Level 1: Execute all planned searches in parallel
        logger.info(f"🔍 Level 1: Executing {len(plan.search_queries)} searches...")
        search_tasks = [
            self._execute_search(query, max_sources // len(plan.search_queries))
            for query in plan.search_queries[: self.max_searches_per_level]
        ]

        level1_results = await asyncio.gather(*search_tasks, return_exceptions=True)

        for results in level1_results:
            if isinstance(results, list):
                for result in results:
                    url = result.get("url", "")
                    if url and url not in seen_urls:
                        evidence = self._create_evidence(result)
                        all_evidence.append(evidence)
                        seen_urls.add(url)

        logger.info(f"✅ Level 1: Collected {len(all_evidence)} sources")

        # Level 2: Gap analysis and follow-up searches
        if max_depth >= 2 and len(all_evidence) < max_sources:
            logger.info(
                "🔍 Level 2: Analyzing gaps and conducting follow-up searches..."
            )
            gaps = await self._identify_knowledge_gaps(
                plan, all_evidence, backend, model
            )

            if gaps:
                followup_queries = await self._generate_followup_queries(
                    gaps, backend, model
                )

                followup_tasks = [
                    self._execute_search(query, 3) for query in followup_queries[:3]
                ]

                level2_results = await asyncio.gather(
                    *followup_tasks, return_exceptions=True
                )

                for results in level2_results:
                    if isinstance(results, list):
                        for result in results:
                            url = result.get("url", "")
                            if (
                                url
                                and url not in seen_urls
                                and len(all_evidence) < max_sources
                            ):
                                evidence = self._create_evidence(result)
                                all_evidence.append(evidence)
                                seen_urls.add(url)

                logger.info(
                    f"✅ Level 2: Added {len(all_evidence) - len(seen_urls)} more sources"
                )

        # Score and rank evidence by quality
        for evidence in all_evidence:
            evidence.quality_score = self._calculate_quality_score(evidence)

        # Sort by quality and limit to max_sources
        all_evidence.sort(key=lambda e: e.quality_score, reverse=True)
        filtered_evidence = all_evidence[:max_sources]

        logger.info(
            f"📊 Final evidence set: {len(filtered_evidence)} high-quality sources"
        )
        return filtered_evidence

    async def _execute_search(
        self, query: str, max_results: int
    ) -> List[Dict[str, Any]]:
        """Execute a single search query"""
        try:
            results = await self.search_service.search(
                query=query,
                max_results=max_results,
                scrape_content=True,  # Enable content scraping
            )
            return results
        except Exception as e:
            logger.error(f"Search failed for '{query}': {e}")
            return []

    def _create_evidence(self, search_result: Dict[str, Any]) -> Evidence:
        """Convert search result to Evidence object"""
        content = search_result.get("content", search_result.get("snippet", ""))

        return Evidence(
            source_url=search_result.get("url", ""),
            title=search_result.get("title", ""),
            snippet=search_result.get("snippet", ""),
            content=content,
            relevance_score=search_result.get("relevance_score", 0.5),
            quality_score=0.0,  # Will be calculated later
            extraction_time=datetime.now(),
            word_count=search_result.get("word_count", len(content.split())),
        )

    def _calculate_quality_score(self, evidence: Evidence) -> float:
        """
        Calculate quality score based on multiple factors:
        - Content depth (word count)
        - Relevance score
        - Source authority (domain)
        - Freshness (if available)
        """

        # Content depth score (0-1)
        depth_score = min(evidence.word_count / 1000, 1.0) * 0.3

        # Relevance score (already 0-1)
        relevance_score = evidence.relevance_score * 0.4

        # Authority score based on domain
        authority_score = self._score_domain_authority(evidence.source_url) * 0.2

        # Content quality (has actual content vs just snippet)
        content_quality = 0.1 if len(evidence.content) > len(evidence.snippet) else 0.0

        total_score = depth_score + relevance_score + authority_score + content_quality

        return min(total_score, 1.0)

    def _score_domain_authority(self, url: str) -> float:
        """Score domain authority (simple heuristic)"""
        high_authority_domains = [
            ".edu",
            ".gov",
            "wikipedia.org",
            "arxiv.org",
            "nature.com",
            "science.org",
            "ieee.org",
            "acm.org",
            "nih.gov",
            "who.int",
        ]

        medium_authority_domains = [
            ".org",
            "medium.com",
            "github.com",
            "stackoverflow.com",
            "reddit.com",
            "youtube.com",
        ]

        url_lower = url.lower()

        if any(domain in url_lower for domain in high_authority_domains):
            return 1.0
        elif any(domain in url_lower for domain in medium_authority_domains):
            return 0.7
        else:
            return 0.5

    async def _identify_knowledge_gaps(
        self, plan: ResearchPlan, evidence: List[Evidence], backend: str, model: str
    ) -> List[str]:
        """Use LLM to identify gaps in collected evidence"""

        if not evidence:
            return plan.sub_questions

        gap_prompt = f"""Given a research question and collected evidence, identify knowledge gaps.

Research Question: {plan.main_question}

Sub-questions to answer:
{chr(10).join(f"- {q}" for q in plan.sub_questions)}

Evidence collected from {len(evidence)} sources.

What important information is still missing? List 2-3 specific gaps."""

        try:
            response = await self.llm_service.generate_response(
                message=gap_prompt,
                backend=backend,
                model=model,
                config={"temperature": 0.4, "max_tokens": 300},
            )

            self.llm_calls_count += 1
            self.tokens_used += response.get("tokens", {}).get("total", 0)

            content = response.get("content", "")
            gaps = [
                line.strip("- ").strip() for line in content.split("\n") if line.strip()
            ]

            return gaps[:3]

        except Exception as e:
            logger.warning(f"Gap analysis failed: {e}")
            return []

    async def _generate_followup_queries(
        self, gaps: List[str], backend: str, model: str
    ) -> List[str]:
        """Generate search queries to fill knowledge gaps"""

        queries_prompt = f"""Generate specific search queries to fill these knowledge gaps:

{chr(10).join(f"- {gap}" for gap in gaps)}

Generate 2-3 targeted search queries. Be specific and actionable."""

        try:
            response = await self.llm_service.generate_response(
                message=queries_prompt,
                backend=backend,
                model=model,
                config={"temperature": 0.5, "max_tokens": 200},
            )

            self.llm_calls_count += 1
            self.tokens_used += response.get("tokens", {}).get("total", 0)

            content = response.get("content", "")
            queries = [
                line.strip("- ").strip() for line in content.split("\n") if line.strip()
            ]

            return queries[:3]

        except Exception as e:
            logger.warning(f"Followup query generation failed: {e}")
            return []

    async def _multi_hop_reasoning(
        self,
        plan: ResearchPlan,
        evidence: List[Evidence],
        backend: str,
        model: str,
    ) -> List[ReasoningStep]:
        """
        Perform multi-hop reasoning to answer sub-questions
        and build a reasoning chain.
        """

        reasoning_trace = []

        for idx, question in enumerate(plan.sub_questions, 1):
            logger.info(
                f"🧠 Reasoning step {idx}/{len(plan.sub_questions)}: {question}"
            )

            # Find relevant evidence for this question
            relevant_evidence = self._filter_relevant_evidence(question, evidence)

            if not relevant_evidence:
                logger.warning(f"No evidence found for: {question}")
                continue

            # Analyze evidence and generate finding
            finding = await self._analyze_evidence_for_question(
                question, relevant_evidence, backend, model
            )

            step = ReasoningStep(
                step=idx,
                question=question,
                sources_consulted=[e.source_url for e in relevant_evidence],
                finding=finding.get("answer", "Insufficient information"),
                confidence=finding.get("confidence", 0.5),
                contradictions=finding.get("contradictions", []),
            )

            reasoning_trace.append(step)

        return reasoning_trace

    def _filter_relevant_evidence(
        self, question: str, evidence: List[Evidence], top_k: int = 5
    ) -> List[Evidence]:
        """Filter evidence relevant to a specific question"""

        question_terms = set(question.lower().split())

        scored_evidence = []
        for e in evidence:
            # Simple relevance scoring based on term overlap
            content_terms = set(e.content.lower().split())
            title_terms = set(e.title.lower().split())

            title_overlap = len(question_terms & title_terms)
            content_overlap = len(question_terms & content_terms)

            score = (title_overlap * 2) + content_overlap + e.quality_score
            scored_evidence.append((score, e))

        scored_evidence.sort(reverse=True, key=lambda x: x[0])

        return [e for _, e in scored_evidence[:top_k]]

    async def _analyze_evidence_for_question(
        self,
        question: str,
        evidence: List[Evidence],
        backend: str,
        model: str,
    ) -> Dict[str, Any]:
        """Analyze evidence to answer a specific question"""

        evidence_text = "\n\n".join(
            [
                f"Source {idx + 1}: {e.title}\n{e.content[:500]}..."
                for idx, e in enumerate(evidence)
            ]
        )

        analysis_prompt = f"""Analyze the following sources to answer the question.

Question: {question}

Sources:
{evidence_text}

Provide:
1. A clear, factual answer
2. Confidence level (0-1)
3. Any contradictions or disagreements between sources

Format as JSON:
{{
  "answer": "...",
  "confidence": 0.0-1.0,
  "contradictions": ["..."]
}}"""

        try:
            response = await self.llm_service.generate_response(
                message=analysis_prompt,
                backend=backend,
                model=model,
                config={"temperature": 0.2, "max_tokens": 500},
            )

            self.llm_calls_count += 1
            self.tokens_used += response.get("tokens", {}).get("total", 0)

            content = response.get("content", "")

            # Extract JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            result = json.loads(content)
            return result

        except Exception as e:
            logger.warning(f"Evidence analysis failed: {e}")
            return {
                "answer": "Unable to determine from available sources",
                "confidence": 0.3,
                "contradictions": [],
            }

    async def _synthesize_report(
        self,
        query: str,
        plan: ResearchPlan,
        evidence: List[Evidence],
        reasoning_trace: List[ReasoningStep],
        backend: str,
        model: str,
    ) -> FinalReport:
        """Synthesize final comprehensive report"""

        # Build context for synthesis
        findings_text = "\n\n".join(
            [
                f"Question: {step.question}\nFinding: {step.finding}\nConfidence: {step.confidence}"
                for step in reasoning_trace
            ]
        )

        synthesis_prompt = f"""Create a comprehensive research report.

Original Question: {query}

Research Findings:
{findings_text}

Sources Consulted: {len(evidence)}

Generate a professional report with:
1. Executive Summary (150-200 words)
2. Key Insights (3-5 bullet points)
3. Recommendations (2-3 actionable items)
4. Caveats/Limitations (what we don't know)

Be factual, cite confidence levels, and acknowledge uncertainties."""

        try:
            response = await self.llm_service.generate_response(
                message=synthesis_prompt,
                backend=backend,
                model=model,
                config={"temperature": 0.4, "max_tokens": 1500},
            )

            self.llm_calls_count += 1
            self.tokens_used += response.get("tokens", {}).get("total", 0)

            content = response.get("content", "")

            # Parse report sections (simple heuristic)
            report = FinalReport(
                executive_summary=self._extract_section(
                    content, "summary", "executive"
                ),
                detailed_findings=[
                    {
                        "question": step.question,
                        "answer": step.finding,
                        "confidence": step.confidence,
                    }
                    for step in reasoning_trace
                ],
                insights=self._extract_list(content, "insight", "key"),
                recommendations=self._extract_list(content, "recommendation"),
                caveats=self._extract_list(content, "caveat", "limitation"),
            )

            return report

        except Exception as e:
            logger.error(f"Report synthesis failed: {e}")
            # Fallback report
            return FinalReport(
                executive_summary=f"Research on: {query}. Analyzed {len(evidence)} sources.",
                detailed_findings=[],
                insights=[],
                recommendations=[],
                caveats=["Report generation encountered errors"],
            )

    def _extract_section(self, text: str, *keywords) -> str:
        """Extract a section from text based on keywords"""
        lines = text.split("\n")
        section_lines = []
        in_section = False

        for line in lines:
            lower_line = line.lower()
            if any(kw in lower_line for kw in keywords):
                in_section = True
                continue
            if in_section:
                if line.strip() and not line.strip().startswith("#"):
                    section_lines.append(line.strip())
                elif line.strip().startswith("#") and section_lines:
                    break

        return " ".join(section_lines) or text[:300]

    def _extract_list(self, text: str, *keywords) -> List[str]:
        """Extract bullet points from text"""
        lines = text.split("\n")
        items = []

        for line in lines:
            lower_line = line.lower()
            if any(kw in lower_line for kw in keywords):
                # Found section header, start collecting items
                continue
            if line.strip().startswith(("-", "•", "*", "1.", "2.", "3.")):
                items.append(line.strip(" -•*123456789."))

        return items[:5] if items else []

    def _extract_citations(self, evidence: List[Evidence]) -> List[Dict[str, str]]:
        """Extract formatted citations from evidence"""
        citations = []

        for idx, e in enumerate(evidence, 1):
            citations.append(
                {
                    "id": str(idx),
                    "title": e.title,
                    "url": e.source_url,
                    "accessed": e.extraction_time.strftime("%Y-%m-%d"),
                }
            )

        return citations

    def _generate_research_id(self, query: str) -> str:
        """Generate unique research ID from query"""
        return hashlib.md5(query.encode()).hexdigest()[:12]

    def get_cached_research(self, research_id: str) -> Optional[ResearchResult]:
        """Retrieve cached research result"""
        return self.research_cache.get(research_id)
