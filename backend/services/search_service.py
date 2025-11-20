from typing import List, Dict, Any
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup
import requests


class SearchService:
    """Service for web search functionality"""

    def __init__(self):
        self.ddgs = DDGS()

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform a web search and return results"""
        
        results = []
        
        try:
            # Use DuckDuckGo for search
            search_results = self.ddgs.text(query, max_results=max_results)
            
            for result in search_results:
                results.append({
                    "title": result.get("title", ""),
                    "url": result.get("href", ""),
                    "snippet": result.get("body", ""),
                })
                
        except Exception as e:
            print(f"Search error: {e}")
            
        return results

    async def scrape_content(self, url: str) -> str:
        """Scrape and extract main content from a URL"""
        
        try:
            response = requests.get(url, timeout=10)
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
