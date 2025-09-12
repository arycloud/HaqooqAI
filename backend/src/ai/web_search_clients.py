"""
Web search clients for HaqooqAI Backend
Implementation of Exa.ai and SerpAPI clients with fallback functionality
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime, timedelta

from src.config import EXA_API_KEY, SERPAPI_API_KEY

logger = logging.getLogger(__name__)


class ExaSearchClient:
    """Exa.ai search client with health monitoring"""

    def __init__(self):
        self.api_key = EXA_API_KEY
        self.base_url = "https://api.exa.ai"
        self.timeout = 15.0
        self.is_healthy = True
        self.last_error = None

    async def search(self, query: str, **kwargs) -> str:
        """
        Perform search using Exa.ai API
        
        Args:
            query: Search query
            **kwargs: Additional parameters for search
            
        Returns:
            str: Formatted search results
        """
        if not self.api_key:
            logger.warning("Exa.ai API key not configured")
            return "No search results found - Exa.ai API key not configured"

        try:
            # Prepare search parameters
            search_params = {
                "query": query,
                "type": "neural",
                "useAutoprompt": True,
                "numResults": 5,
                "contents": {
                    "text": True
                }
            }
            
            # Add any additional parameters
            search_params.update(kwargs)
            
            # Make API request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/search",
                    json=search_params,
                    headers={
                        "accept": "application/json",
                        "content-type": "application/json",
                        "x-api-key": self.api_key
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Exa.ai API error: {response.status_code} - {response.text}")
                
                data = response.json()
                return self._format_results(data)
                
        except Exception as e:
            self.is_healthy = False
            self.last_error = str(e)
            logger.error(f"Exa.ai search failed: {e}")
            return f"No search results found - Exa.ai search error: {str(e)}"

    def _format_results(self, data: Dict[str, Any]) -> str:
        """Format Exa.ai results into readable text"""
        results = data.get("results", [])
        
        if not results:
            return "No search results found"
        
        formatted_results = []
        
        for i, result in enumerate(results[:5], 1):  # Limit to top 5 results
            title = result.get("title", "No title")
            url = result.get("url", "")
            text = result.get("text", "")
            
            # Clean up content
            if text:
                text = text.strip()
                if len(text) > 300:
                    text = text[:300] + "..."
            
            formatted_result = f"Result {i}: {title}"
            if url:
                formatted_result += f"\nURL: {url}"
            if text:
                formatted_result += f"\nSummary: {text}"
            
            formatted_results.append(formatted_result)
        
        return "\n\n---\n\n".join(formatted_results)

    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status of Exa.ai client"""
        return {
            "provider": "exa",
            "healthy": self.is_healthy,
            "last_error": self.last_error,
            "api_key_configured": bool(self.api_key)
        }


class SerpAPIClient:
    """SerpAPI search client with health monitoring"""

    def __init__(self):
        self.api_key = SERPAPI_API_KEY
        self.base_url = "https://serpapi.com"
        self.timeout = 15.0
        self.is_healthy = True
        self.last_error = None

    async def search(self, query: str, **kwargs) -> str:
        """
        Perform search using SerpAPI
        
        Args:
            query: Search query
            **kwargs: Additional parameters for search
            
        Returns:
            str: Formatted search results
        """
        if not self.api_key:
            logger.warning("SerpAPI key not configured")
            return "No search results found - SerpAPI key not configured"

        try:
            # Prepare search parameters
            search_params = {
                "q": query,
                "api_key": self.api_key,
                "engine": "google",
                "num": 5
            }
            
            # Add any additional parameters
            search_params.update(kwargs)
            
            # Make API request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params=search_params,
                    headers={
                        "User-Agent": "HaqooqAI-Backend/2.0"
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"SerpAPI error: {response.status_code} - {response.text}")
                
                data = response.json()
                return self._format_results(data)
                
        except Exception as e:
            self.is_healthy = False
            self.last_error = str(e)
            logger.error(f"SerpAPI search failed: {e}")
            return f"No search results found - SerpAPI search error: {str(e)}"

    def _format_results(self, data: Dict[str, Any]) -> str:
        """Format SerpAPI results into readable text"""
        results = data.get("organic_results", [])
        
        if not results:
            return "No search results found"
        
        formatted_results = []
        
        for i, result in enumerate(results[:5], 1):  # Limit to top 5 results
            title = result.get("title", "No title")
            url = result.get("link", "")
            snippet = result.get("snippet", "")
            
            # Clean up content
            if snippet:
                snippet = snippet.strip()
                if len(snippet) > 300:
                    snippet = snippet[:300] + "..."
            
            formatted_result = f"Result {i}: {title}"
            if url:
                formatted_result += f"\nURL: {url}"
            if snippet:
                formatted_result += f"\nSummary: {snippet}"
            
            formatted_results.append(formatted_result)
        
        return "\n\n---\n\n".join(formatted_results)

    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status of SerpAPI client"""
        return {
            "provider": "serpapi",
            "healthy": self.is_healthy,
            "last_error": self.last_error,
            "api_key_configured": bool(self.api_key)
        }


class WebSearchManager:
    """Manages multiple web search clients with fallback functionality"""

    def __init__(self):
        self.exa_client = ExaSearchClient()
        self.serpapi_client = SerpAPIClient()
        self.clients = [self.exa_client, self.serpapi_client]
        self.primary_client = self.exa_client
        self.fallback_client = self.serpapi_client

    async def search(self, query: str) -> str:
        """
        Perform search using primary client, fallback to secondary if needed
        
        Args:
            query: Search query
            
        Returns:
            str: Formatted search results
        """
        # Try primary client first
        logger.info(f"Using primary web search client ({self.primary_client.__class__.__name__}) for query: '{query}'")
        result = await self.primary_client.search(query)
        
        # If primary client failed, try fallback
        if "No search results found" in result or not result.strip():
            logger.info(f"Primary search client failed, using fallback ({self.fallback_client.__class__.__name__})")
            result = await self.fallback_client.search(query)
            
            # If fallback also failed, return error
            if "No search results found" in result or not result.strip():
                logger.error("Both primary and fallback web search clients failed")
                return "No search results found - all web search services unavailable"
        
        return result

    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all web search clients"""
        statuses = []
        for client in self.clients:
            status = await client.get_health_status()
            statuses.append(status)
        
        return {
            "clients": statuses,
            "primary": self.primary_client.__class__.__name__,
            "fallback": self.fallback_client.__class__.__name__
        }

    def rotate_primary_client(self):
        """Rotate primary and fallback clients"""
        self.primary_client, self.fallback_client = self.fallback_client, self.primary_client
        logger.info(f"Rotated web search clients. Primary: {self.primary_client.__class__.__name__}")


# Global instance
web_search_manager = WebSearchManager()