"""
RAG Engine for HaqooqAI Backend
Integrates LegalAssistantAgent with source extraction and processing
"""
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

from .agent import LegalAssistantAgent
from .tools import retrieve_relevant_chunks
from .searxng_client import searxng_client
from ..models.responses import SourceInfo
from ..services.context_manager import ContextManager

logger = logging.getLogger(__name__)


class LegalRAGEngine:
    """
    Legal RAG Engine that processes queries and returns structured responses
    """

    def __init__(self):
        """Initialize the RAG engine with agent and tools"""
        try:
            self.agent = LegalAssistantAgent()
            logger.info("LegalRAGEngine initialized successfully")
            self.context_manager = ContextManager()
            logger.info("Context Manager initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing LegalRAGEngine: {e}")
            self.agent = None

    async def process_query(self, query: str, groq_key: Optional[str] = None,
                            conversation_id: Optional[str] = None,
                            user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Process a legal query and return structured response with sources

        Args:
            query: User's legal query
            groq_key: Optional user's Groq API key

        Returns:
            Dict containing response, sources, and metadata
        """
        start_time = time.time()

        if not self.agent:
            return {
                "response": "RAG engine is not available. Please try again later.",
                "sources": [],
                "processing_time": 0,
                "error": "RAG engine initialization failed"
            }

        try:
            chat_history = []
            if conversation_id and user_id:
                chat_history = await self.context_manager.get_chat_history(conversation_id, user_id)
            # Process query through the agent
            agent_result = await self.agent.run(query, groq_key, chat_history=chat_history)

            # Extract and enhance sources
            sources = await self._enhance_sources(
                agent_result.get("sources", []),
                query
            )

            processing_time = time.time() - start_time

            return {
                "response": agent_result.get("response", "No response generated"),
                "sources": sources,
                "processing_time": processing_time,
                "query_analysis": agent_result.get("query_analysis", {}),
                "error": agent_result.get("error")
            }

        except Exception as e:
            logger.error(f"Error processing query: {e}")
            processing_time = time.time() - start_time

            return {
                "response": f"An error occurred while processing your query: {str(e)}",
                "sources": [],
                "processing_time": processing_time,
                "error": str(e)
            }

    async def _enhance_sources(self, basic_sources: List[Dict], query: str) -> List[SourceInfo]:
        """
        Enhance basic source information with additional metadata

        Args:
            basic_sources: Basic source information from agent
            query: Original query for context

        Returns:
            List of enhanced SourceInfo objects
        """
        enhanced_sources = []

        try:
            # Get local document sources
            local_chunks = retrieve_relevant_chunks(query, n_results=3)

            for chunk in local_chunks:
                if chunk.get("distance", 1.0) < 0.7:  # Only include relevant chunks
                    source = SourceInfo(
                        type="legal_doc",
                        title=chunk.get("source_file", "Unknown Document"),
                        section=chunk.get("section_title"),
                        reference=f"{chunk.get('source_file', 'Unknown')}_{chunk.get('section_title', 'Unknown')}",
                        relevance_score=1.0 - chunk.get("distance", 1.0)
                    )
                    enhanced_sources.append(source)

            # Add web search sources from basic_sources
            for basic_source in basic_sources:
                if basic_source.get("type") == "web_search":
                    source = SourceInfo(
                        type="web_search",
                        title=basic_source.get("title", "Web Search Result"),
                        url=basic_source.get("url"),
                        reference=basic_source.get("reference")
                    )
                    enhanced_sources.append(source)

        except Exception as e:
            logger.error(f"Error enhancing sources: {e}")

        return enhanced_sources

    def search_local_knowledge(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search local knowledge base directly

        Args:
            query: Search query
            n_results: Number of results to return

        Returns:
            List of relevant chunks
        """
        try:
            return retrieve_relevant_chunks(query, n_results)
        except Exception as e:
            logger.error(f"Error searching local knowledge: {e}")
            return []

    async def web_search(self, query: str) -> str:
        """
        Perform web search directly

        Args:
            query: Search query

        Returns:
            Formatted search results
        """
        try:
            return await searxng_client.search(query)
        except Exception as e:
            logger.error(f"Error in web search: {e}")
            return "Web search unavailable"

    async def check_rag_health(self) -> Dict[str, Any]:
        """
        Check health of RAG engine components

        Returns:
            Dict with health status of each component
        """
        health_status = {
            "agent": "unknown",
            "local_search": "unknown",
            "web_search": "unknown",
            "overall": "unknown"
        }

        try:
            # Check agent
            if self.agent and self.agent.default_agent_executor:
                health_status["agent"] = "healthy"
            else:
                health_status["agent"] = "unhealthy"

            # Check local search
            try:
                test_chunks = retrieve_relevant_chunks("test query", n_results=1)
                health_status["local_search"] = "healthy"
            except Exception:
                health_status["local_search"] = "unhealthy"

            # Check web search
            try:
                searx_health = await searxng_client.check_searxng_health()
                health_status["web_search"] = searx_health.get("status", "unhealthy")
            except Exception:
                health_status["web_search"] = "unhealthy"

            # Determine overall health
            healthy_components = sum(1 for status in health_status.values()
                                   if status == "healthy")
            total_components = len([k for k in health_status.keys() if k != "overall"])

            if healthy_components == total_components:
                health_status["overall"] = "healthy"
            elif healthy_components > 0:
                health_status["overall"] = "degraded"
            else:
                health_status["overall"] = "unhealthy"

        except Exception as e:
            logger.error(f"Error checking RAG health: {e}")
            health_status["overall"] = "error"
            health_status["error"] = str(e)

        return health_status

    def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get usage statistics for the RAG engine

        Returns:
            Dict with usage statistics
        """
        return {
            "agent_initialized": self.agent is not None,
            "default_llm_available": (self.agent.default_agent_executor is not None
                                    if self.agent else False),
            "tools_count": len(self.agent.tools) if self.agent else 0,
            "timestamp": datetime.now().isoformat()
        }
