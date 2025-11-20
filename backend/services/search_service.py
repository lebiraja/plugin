from typing import List, Dict, Any
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup
import httpx
import asyncio
import random
import os


class SearchService:
    """Service for web search functionality"""

    def __init__(self):
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]
        # Serper.dev API key from environment variable
        self.serper_api_key = os.getenv('SERPER_API_KEY')

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform a web search using Serper.dev (primary) with DuckDuckGo fallback"""
        
        results = []
        
        # Try Serper.dev first (more reliable, no rate limiting issues)
        if self.serper_api_key:
            try:
                print(f"Searching with Serper.dev: {query}")
                results = await self._serper_search(query, max_results)
                if results:
                    print(f"Serper.dev search successful: {len(results)} results")
                    return results
            except Exception as e:
                print(f"Serper.dev search failed: {e}, falling back to DuckDuckGo")
        
        # Fallback to DuckDuckGo if Serper fails or no API key
        for attempt in range(3):
            try:
                if attempt > 0:
                    delay = min(2 ** attempt, 10)
                    print(f"Waiting {delay}s before retry {attempt + 1}...")
                    await asyncio.sleep(delay)
                
                ddgs = DDGS(headers={'User-Agent': random.choice(self.user_agents)}, timeout=20)
                search_results = ddgs.text(query, max_results=max_results)
                
                for result in search_results:
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("href", ""),
                        "snippet": result.get("body", ""),
                    })
                
                if results:
                    print(f"DuckDuckGo search successful: {len(results)} results")
                    break
                    
            except Exception as e:
                print(f"DuckDuckGo attempt {attempt + 1} failed: {e}")
                if attempt == 2:
                    results.append({
                        "title": "Web Search Unavailable",
                        "url": "",
                        "snippet": f"Both search providers are temporarily unavailable. Please try again in a moment. Query: {query}",
                    })
        
        return results

    async def _serper_search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Primary search using Serper.dev API"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://google.serper.dev/search",
                    json={"q": query, "num": max_results},
                    headers={
                        'X-API-KEY': self.serper_api_key,
                        'Content-Type': 'application/json'
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                results = []
                
                # Process organic results
                for result in data.get("organic", [])[:max_results]:
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("link", ""),
                        "snippet": result.get("snippet", ""),
                    })
                
                # If we have a knowledge graph, add it as first result
                if "knowledgeGraph" in data and results:
                    kg = data["knowledgeGraph"]
                    if kg.get("description"):
                        results.insert(0, {
                            "title": kg.get("title", "Knowledge Graph"),
                            "url": kg.get("descriptionLink", ""),
                            "snippet": kg.get("description", ""),
                        })
                
                return results[:max_results]
                
        except Exception as e:
            print(f"Serper.dev API error: {e}")
            raise

    async def scrape_content(self, url: str) -> str:
        """Scrape and extract main content from a URL"""
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={'User-Agent': random.choice(self.user_agents)},
                    follow_redirects=True
                )
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, "html.parser")
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                
                # Get text
                text = soup.get_text()
                
                # Clean up whitespace
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = "\n".join(chunk for chunk in chunks if chunk)
                
                return text
            
        except Exception as e:
            print(f"Scraping error: {e}")
            return ""
