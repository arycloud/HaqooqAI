"""
SearxNG Client for HaqooqAI Backend
Production-grade search client with health monitoring
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime, timedelta

from ..config import SEARXNG_HEALTH_ENDPOINTS

logger = logging.getLogger(__name__)


class SearxNGClient:
    """Production-grade SearxNG client with health monitoring and failover"""

    def __init__(self):
        self.instances = SEARXNG_HEALTH_ENDPOINTS.copy()
        self.healthy_instances = []
        self.last_health_check = None
        self.health_check_interval = timedelta(minutes=5)
        self.timeout = 10.0
        self.max_retries = 3

    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status of all SearxNG instances"""
        now = datetime.now()

        # Check if we need to refresh health status
        if (self.last_health_check is None or
            now - self.last_health_check > self.health_check_interval):
            await self._check_instance_health()

        return {
            "total_instances": len(self.instances),
            "healthy": len(self.healthy_instances),
            "last_check": self.last_health_check.isoformat() if self.last_health_check else None,
            "healthy_instances": self.healthy_instances
        }

    async def _check_instance_health(self) -> None:
        """Check health of all SearxNG instances"""
        healthy = []

        async def check_instance(instance_url: str) -> Optional[str]:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        f"{instance_url}/healthz",
                        headers={"User-Agent": "HaqooqAI-Backend/2.0"}
                    )
                    if response.status_code == 200:
                        return instance_url
            except Exception as e:
                logger.debug(f"Health check failed for {instance_url}: {e}")
            return None

        # Check all instances concurrently
        tasks = [check_instance(instance) for instance in self.instances]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, str):  # Healthy instance URL
                healthy.append(result)

        self.healthy_instances = healthy
        self.last_health_check = datetime.now()

        logger.info(f"Health check complete: {len(healthy)}/{len(self.instances)} instances healthy")

    async def search(self, query: str, categories: str = "general",
                    engines: Optional[str] = None) -> str:
        """
        Perform search using healthy SearxNG instances

        Args:
            query: Search query
            categories: Search categories (default: "general")
            engines: Specific engines to use (optional)

        Returns:
            str: Formatted search results
        """
        if not query.strip():
            return "No search results found - empty query"

        # Ensure we have healthy instances
        await self.get_health_status()

        if not self.healthy_instances:
            logger.error("No healthy SearxNG instances available")
            return "No search results found - search service unavailable"

        # Try each healthy instance
        for instance in self.healthy_instances:
            try:
                result = await self._search_instance(instance, query, categories, engines)
                if result and "No search results found" not in result:
                    return result
            except Exception as e:
                logger.warning(f"Search failed on {instance}: {e}")
                continue

        return "No search results found - all search attempts failed"

    async def _search_instance(self, instance_url: str, query: str,
                              categories: str, engines: Optional[str]) -> str:
        """Search using a specific SearxNG instance"""
        params = {
            "q": query,
            "format": "json",
            "categories": categories,
            "safesearch": "1"
        }

        if engines:
            params["engines"] = engines

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{instance_url}/search",
                params=params,
                headers={
                    "User-Agent": "HaqooqAI-Backend/2.0",
                    "Accept": "application/json"
                }
            )

            if response.status_code != 200:
                raise Exception(f"HTTP {response.status_code}: {response.text}")

            data = response.json()
            return self._format_results(data)

    def _format_results(self, data: Dict[str, Any]) -> str:
        """Format SearxNG results into readable text"""
        results = data.get("results", [])

        if not results:
            return "No search results found"

        formatted_results = []

        for i, result in enumerate(results[:5], 1):  # Limit to top 5 results
            title = result.get("title", "No title")
            url = result.get("url", "")
            content = result.get("content", "")

            # Clean up content
            if content:
                content = content.strip()
                if len(content) > 200:
                    content = content[:200] + "..."

            formatted_result = f"Result {i}: {title}"
            if url:
                formatted_result += f"\nURL: {url}"
            if content:
                formatted_result += f"\nSummary: {content}"

            formatted_results.append(formatted_result)

        return "\n\n---\n\n".join(formatted_results)

    async def check_searxng_health(self) -> Dict[str, Any]:
        """
        Check overall SearxNG service health

        Returns:
            dict: Health status information
        """
        try:
            health_status = await self.get_health_status()

            return {
                "status": "healthy" if health_status["healthy"] > 0 else "unhealthy",
                "healthy_instances": health_status["healthy"],
                "total_instances": health_status["total_instances"],
                "last_check": health_status["last_check"]
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "healthy_instances": 0,
                "total_instances": len(self.instances)
            }


# Global instance
searxng_client = SearxNGClient()
