"""
Web search with content scraping.

Serper.dev is the primary provider (reliable, no rate-limit dance); DuckDuckGo
is the fallback when no API key is set or Serper fails. Scraped page content is
cached in-process with a real TTL, and concurrent scraping is bounded so a
single search can't open dozens of sockets at once.

Every returned result is normalized to the same shape — ``title``, ``url``,
``snippet``, ``content``, ``word_count``, ``relevance_score`` — because deep
research relies on those keys always being present.
"""

import asyncio
import logging
import random
import re
from datetime import datetime
from typing import Any, Dict, List

import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

from config import settings

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]
CACHE_TTL_SECONDS = 3600
MAX_CONCURRENT_SCRAPES = 5


class SearchService:
    """Web search with optional page-content scraping."""

    def __init__(self, secret_service=None):
        # The Serper key is resolved per-search: a runtime key stored (encrypted)
        # via the Settings UI takes precedence over the SERPER_API_KEY env var.
        self._secret_service = secret_service
        self._content_cache: Dict[str, Dict[str, Any]] = {}
        self._scrape_semaphore = asyncio.Semaphore(MAX_CONCURRENT_SCRAPES)

    async def _resolve_serper_key(self) -> str:
        if self._secret_service is not None:
            from services.secret_service import SERPER_KEY

            stored = await self._secret_service.get_secret(SERPER_KEY)
            if stored:
                return stored
        return settings.serper_api_key

    async def search(
        self, query: str, max_results: int = 5, scrape_content: bool = True
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        serper_key = await self._resolve_serper_key()
        if serper_key:
            try:
                results = await self._serper_search(query, max_results, serper_key)
            except Exception as exc:
                logger.warning("Serper failed (%s); falling back to DuckDuckGo", exc)

        if not results:
            results = await self._ddg_search(query, max_results)

        results = [self._normalize(r, query) for r in results]

        if scrape_content and results:
            results = await self._enhance_with_content(results, query)

        results.sort(key=lambda r: r.get("relevance_score", 0), reverse=True)
        return results[:max_results]

    # ── providers ─────────────────────────────────────────────────────────────

    async def _serper_search(
        self, query: str, max_results: int, api_key: str
    ) -> List[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://google.serper.dev/search",
                json={"q": query, "num": max_results},
                headers={
                    "X-API-KEY": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

        results = [
            {"title": r.get("title", ""), "url": r.get("link", ""), "snippet": r.get("snippet", "")}
            for r in data.get("organic", [])[:max_results]
        ]
        kg = data.get("knowledgeGraph")
        if kg and kg.get("description"):
            results.insert(
                0,
                {
                    "title": kg.get("title", "Knowledge Graph"),
                    "url": kg.get("descriptionLink", ""),
                    "snippet": kg.get("description", ""),
                },
            )
        return results[:max_results]

    async def _ddg_search(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        for attempt in range(3):
            if attempt:
                await asyncio.sleep(min(2**attempt, 10))
            try:
                # DDGS is sync; run it off the event loop.
                raw = await asyncio.to_thread(self._ddg_call, query, max_results)
                return [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    }
                    for r in raw
                ]
            except Exception as exc:
                logger.warning("DuckDuckGo attempt %d failed: %s", attempt + 1, exc)
        logger.error("All search providers unavailable for query: %s", query)
        return []

    @staticmethod
    def _ddg_call(query: str, max_results: int) -> List[Dict[str, Any]]:
        ddgs = DDGS(headers={"User-Agent": random.choice(USER_AGENTS)}, timeout=20)
        return list(ddgs.text(query, max_results=max_results))

    # ── normalization ─────────────────────────────────────────────────────────

    def _normalize(self, result: Dict[str, Any], query: str) -> Dict[str, Any]:
        title = result.get("title", "")
        snippet = result.get("snippet", result.get("body", ""))
        return {
            "title": title,
            "url": result.get("url", result.get("href", "")),
            "snippet": snippet,
            "content": result.get("content", ""),
            "word_count": result.get("word_count", 0),
            "relevance_score": self._calculate_relevance(query, title, snippet),
        }

    # ── content scraping ──────────────────────────────────────────────────────

    async def _enhance_with_content(
        self, results: List[Dict[str, Any]], query: str
    ) -> List[Dict[str, Any]]:
        enhanced = await asyncio.gather(
            *(self._scrape_and_summarize(r, query) for r in results),
            return_exceptions=True,
        )
        out = []
        for original, result in zip(results, enhanced):
            out.append(result if isinstance(result, dict) else original)
        return out

    async def _scrape_and_summarize(
        self, result: Dict[str, Any], query: str
    ) -> Dict[str, Any]:
        url = result.get("url", "")
        cached = self._content_cache.get(url)
        if cached and (datetime.now() - cached["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
            result["content"] = cached["content"]
            result["word_count"] = cached["word_count"]
            return result

        async with self._scrape_semaphore:
            content = await self.scrape_content(url)
        if content:
            summary = self._extract_relevant_content(content, query, max_words=300)
            word_count = len(content.split())
            self._content_cache[url] = {
                "content": summary,
                "word_count": word_count,
                "timestamp": datetime.now(),
            }
            result["content"] = summary
            result["word_count"] = word_count
        return result

    async def scrape_content(self, url: str, max_length: int = 10000) -> str:
        if not url:
            return ""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": random.choice(USER_AGENTS)},
                    follow_redirects=True,
                )
                response.raise_for_status()

            soup = BeautifulSoup(response.content, "html.parser")
            for tag in soup(
                ["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]
            ):
                tag.decompose()

            main = (
                soup.find("main")
                or soup.find("article")
                or soup.find("div", class_=re.compile("content|main|article"))
            )
            text = (main or soup).get_text(separator="\n")
            lines = (line.strip() for line in text.splitlines())
            text = "\n".join(chunk for chunk in lines if chunk)
            return text[:max_length] + "..." if len(text) > max_length else text
        except Exception as exc:
            logger.debug("Scrape failed for %s: %s", url, exc)
            return ""

    @staticmethod
    def _extract_relevant_content(content: str, query: str, max_words: int = 300) -> str:
        if not content:
            return ""
        paragraphs = [p.strip() for p in content.split("\n") if len(p.strip()) > 50]
        if not paragraphs:
            return content[: max_words * 5]

        query_terms = set(query.lower().split())
        scored = sorted(
            ((sum(1 for t in query_terms if t in p.lower()), p) for p in paragraphs),
            reverse=True,
            key=lambda x: x[0],
        )
        parts, words = [], 0
        for score, para in scored:
            if score == 0:
                break
            pw = len(para.split())
            if words + pw > max_words:
                break
            parts.append(para)
            words += pw
        return "\n\n".join(parts) if parts else "\n\n".join(paragraphs[:3])

    @staticmethod
    def _calculate_relevance(query: str, title: str, snippet: str) -> float:
        query_terms = set(query.lower().split())
        title_l, snippet_l = title.lower(), snippet.lower()
        title_matches = sum(3 for t in query_terms if t in title_l)
        snippet_matches = sum(1 for t in query_terms if t in snippet_l)
        phrase_bonus = 5 if query.lower() in title_l or query.lower() in snippet_l else 0
        return float(title_matches + snippet_matches + phrase_bonus)
