from typing import List, Dict, Any
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup
import httpx
import asyncio
import random
import os
import re
from datetime import datetime


class SearchService:
    """Service for web search functionality with enhanced content extraction"""

    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]
        # Serper.dev API key from environment variable
        self.serper_api_key = os.getenv("SERPER_API_KEY")
        # Cache for scraped content (simple in-memory cache)
        self._content_cache: Dict[str, Dict[str, Any]] = {}

    async def search(
        self, query: str, max_results: int = 5, scrape_content: bool = True
    ) -> List[Dict[str, Any]]:
        """Perform enhanced web search with content scraping and summarization"""

        results = []

        # Try Serper.dev first (more reliable, no rate limiting issues)
        if self.serper_api_key:
            try:
                print(f"🔍 Searching with Serper.dev: {query}")
                results = await self._serper_search(query, max_results)
                if results:
                    print(f"✅ Serper.dev: {len(results)} results found")
            except Exception as e:
                print(f"❌ Serper.dev failed: {e}, using DuckDuckGo")

        # Fallback to DuckDuckGo if Serper fails or no API key
        if not results:
            for attempt in range(3):
                try:
                    if attempt > 0:
                        delay = min(2**attempt, 10)
                        print(f"⏳ Retry {attempt + 1} in {delay}s...")
                        await asyncio.sleep(delay)

                    ddgs = DDGS(
                        headers={"User-Agent": random.choice(self.user_agents)},
                        timeout=20,
                    )
                    search_results = ddgs.text(query, max_results=max_results)

                    for result in search_results:
                        results.append(
                            {
                                "title": result.get("title", ""),
                                "url": result.get("href", ""),
                                "snippet": result.get("body", ""),
                                "relevance_score": self._calculate_relevance(
                                    query,
                                    result.get("title", ""),
                                    result.get("body", ""),
                                ),
                            }
                        )

                    if results:
                        print(f"✅ DuckDuckGo: {len(results)} results found")
                        break

                except Exception as e:
                    print(f"❌ DuckDuckGo attempt {attempt + 1} failed: {e}")
                    if attempt == 2:
                        return [
                            {
                                "title": "Web Search Unavailable",
                                "url": "",
                                "snippet": f"Search providers are temporarily unavailable. Query: {query}",
                                "content": "",
                            }
                        ]

        # Enhance results with scraped content (in parallel)
        if scrape_content and results:
            print(f"📄 Scraping content from {len(results)} URLs...")
            results = await self._enhance_results_with_content(results, query)

        # Sort by relevance
        results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        return results[:max_results]

    async def _serper_search(
        self, query: str, max_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Primary search using Serper.dev API"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://google.serper.dev/search",
                    json={"q": query, "num": max_results},
                    headers={
                        "X-API-KEY": self.serper_api_key,
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()
                data = response.json()

                results = []

                # Process organic results
                for result in data.get("organic", [])[:max_results]:
                    results.append(
                        {
                            "title": result.get("title", ""),
                            "url": result.get("link", ""),
                            "snippet": result.get("snippet", ""),
                        }
                    )

                # If we have a knowledge graph, add it as first result
                if "knowledgeGraph" in data and results:
                    kg = data["knowledgeGraph"]
                    if kg.get("description"):
                        results.insert(
                            0,
                            {
                                "title": kg.get("title", "Knowledge Graph"),
                                "url": kg.get("descriptionLink", ""),
                                "snippet": kg.get("description", ""),
                            },
                        )

                return results[:max_results]

        except Exception as e:
            print(f"Serper.dev API error: {e}")
            raise

    async def _enhance_results_with_content(
        self, results: List[Dict[str, Any]], query: str
    ) -> List[Dict[str, Any]]:
        """Enhance search results by scraping and summarizing content in parallel"""
        tasks = [self._scrape_and_summarize(result, query) for result in results]
        enhanced = await asyncio.gather(*tasks, return_exceptions=True)

        enhanced_results = []
        for i, result in enumerate(results):
            if isinstance(enhanced[i], dict):
                enhanced_results.append(enhanced[i])
            else:
                # If scraping failed, keep original result
                result["content"] = ""
                enhanced_results.append(result)

        return enhanced_results

    async def _scrape_and_summarize(
        self, result: Dict[str, Any], query: str
    ) -> Dict[str, Any]:
        """Scrape content from URL and create a focused summary"""
        url = result.get("url", "")

        # Check cache first
        if url in self._content_cache:
            cached = self._content_cache[url]
            # Cache valid for 1 hour
            if (datetime.now() - cached["timestamp"]).seconds < 3600:
                result["content"] = cached["content"]
                result["word_count"] = cached["word_count"]
                return result

        try:
            content = await self.scrape_content(url)
            if content:
                # Extract relevant sections based on query
                summary = self._extract_relevant_content(content, query, max_words=300)
                word_count = len(content.split())

                # Cache the result
                self._content_cache[url] = {
                    "content": summary,
                    "word_count": word_count,
                    "timestamp": datetime.now(),
                }

                result["content"] = summary
                result["word_count"] = word_count
            else:
                result["content"] = ""
        except Exception as e:
            print(f"⚠️  Scraping {url} failed: {e}")
            result["content"] = ""

        return result

    def _extract_relevant_content(
        self, content: str, query: str, max_words: int = 300
    ) -> str:
        """Extract most relevant sections from content based on query"""
        if not content:
            return ""

        # Split into paragraphs
        paragraphs = [p.strip() for p in content.split("\n") if len(p.strip()) > 50]

        if not paragraphs:
            return content[: max_words * 5]  # Fallback to first N chars

        # Score each paragraph by query term presence
        query_terms = set(query.lower().split())
        scored_paragraphs = []

        for para in paragraphs:
            para_lower = para.lower()
            score = sum(1 for term in query_terms if term in para_lower)
            scored_paragraphs.append((score, para))

        # Sort by relevance and take top paragraphs
        scored_paragraphs.sort(reverse=True, key=lambda x: x[0])

        # Combine top paragraphs until we hit max_words
        result_parts = []
        word_count = 0

        for score, para in scored_paragraphs:
            if score == 0:  # Stop when we hit irrelevant paragraphs
                break
            para_words = len(para.split())
            if word_count + para_words > max_words:
                break
            result_parts.append(para)
            word_count += para_words

        # If we didn't get enough content, add first few paragraphs
        if not result_parts and paragraphs:
            result_parts = paragraphs[:3]

        return "\n\n".join(result_parts)

    def _calculate_relevance(self, query: str, title: str, snippet: str) -> float:
        """Calculate relevance score for a search result"""
        query_terms = set(query.lower().split())
        title_lower = title.lower()
        snippet_lower = snippet.lower()

        # Count term matches in title (weighted higher)
        title_matches = sum(3 for term in query_terms if term in title_lower)

        # Count term matches in snippet
        snippet_matches = sum(1 for term in query_terms if term in snippet_lower)

        # Bonus for exact phrase match
        phrase_bonus = (
            5 if query.lower() in title_lower or query.lower() in snippet_lower else 0
        )

        return title_matches + snippet_matches + phrase_bonus

    async def scrape_content(self, url: str, max_length: int = 10000) -> str:
        """Scrape and extract main content from a URL with better parsing"""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": random.choice(self.user_agents)},
                    follow_redirects=True,
                )
                response.raise_for_status()

                soup = BeautifulSoup(response.content, "html.parser")

                # Remove unwanted elements
                for element in soup(
                    [
                        "script",
                        "style",
                        "nav",
                        "footer",
                        "header",
                        "aside",
                        "iframe",
                        "noscript",
                    ]
                ):
                    element.decompose()

                # Try to find main content area
                main_content = (
                    soup.find("main")
                    or soup.find("article")
                    or soup.find("div", class_=re.compile("content|main|article"))
                )

                if main_content:
                    text = main_content.get_text(separator="\n")
                else:
                    text = soup.get_text(separator="\n")

                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (
                    phrase.strip() for line in lines for phrase in line.split("  ")
                )
                text = "\n".join(chunk for chunk in chunks if chunk)

                # Limit length
                if len(text) > max_length:
                    text = text[:max_length] + "..."

                return text

        except Exception as e:
            print(f"⚠️  Scraping error for {url}: {e}")
            return ""
