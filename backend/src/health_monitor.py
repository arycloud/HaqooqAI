"""
Health Monitoring Module for HaqooqAI Backend
Comprehensive health checks for all system components
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import httpx
import chromadb

from .config import GITHUB_API_URL, VECTOR_DB_DIR, COLLECTION_NAME
from .ai.searxng_client import searxng_client
from .database.supabase_client import supabase_client

logger = logging.getLogger(__name__)


class HealthMonitor:
    """Comprehensive health monitoring for all system components"""

    def __init__(self):
        self.last_check = None
        self.check_interval = timedelta(minutes=1)
        self.health_history = []
        self.max_history = 100

    async def check_all_services(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check of all services

        Returns:
            Dict with health status of all components
        """
        start_time = time.time()

        # Run all health checks concurrently
        tasks = {
            "github_api": self.check_github_api(),
            "chroma_db": self.check_chroma_db(),
            "searxng": self.check_searxng(),
            "supabase": self.check_supabase(),
            "system": self.check_system_resources()
        }

        results = {}
        for service, task in tasks.items():
            try:
                results[service] = await task
            except Exception as e:
                logger.error(f"Health check failed for {service}: {e}")
                results[service] = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }

        # Calculate overall health
        overall_health = self._calculate_overall_health(results)

        health_report = {
            "overall": overall_health,
            "services": results,
            "check_duration": time.time() - start_time,
            "timestamp": datetime.now().isoformat()
        }

        # Store in history
        self._store_health_history(health_report)
        self.last_check = datetime.now()

        return health_report

    async def check_github_api(self) -> Dict[str, Any]:
        """Check GitHub API health"""
        try:
            start_time = time.time()

            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{GITHUB_API_URL}/zen",
                    headers={"User-Agent": "HaqooqAI-Backend/2.0"}
                )

                response_time = time.time() - start_time

                return {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response_time,
                    "status_code": response.status_code,
                    "timestamp": datetime.now().isoformat()
                }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time": None,
                "timestamp": datetime.now().isoformat()
            }

    async def check_chroma_db(self) -> Dict[str, Any]:
        """Check ChromaDB health"""
        try:
            start_time = time.time()

            # Try to connect to ChromaDB
            client = chromadb.PersistentClient(path=VECTOR_DB_DIR)

            # Try to get or create collection
            collection = client.get_or_create_collection(name=COLLECTION_NAME)

            # Try a simple query
            try:
                results = collection.query(
                    query_texts=["test"],
                    n_results=1
                )
                query_success = True
                document_count = collection.count()
            except Exception:
                query_success = False
                document_count = 0

            response_time = time.time() - start_time

            return {
                "status": "healthy" if query_success else "degraded",
                "response_time": response_time,
                "document_count": document_count,
                "collection_name": COLLECTION_NAME,
                "query_success": query_success,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time": None,
                "timestamp": datetime.now().isoformat()
            }

    async def check_searxng(self) -> Dict[str, Any]:
        """Check SearxNG instances health"""
        try:
            health_status = await searxng_client.get_health_status()

            return {
                "status": "healthy" if health_status["healthy"] > 0 else "unhealthy",
                "healthy_instances": health_status["healthy"],
                "total_instances": health_status["total_instances"],
                "last_check": health_status["last_check"],
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    async def check_supabase(self) -> Dict[str, Any]:
        """Check Supabase database health"""
        try:
            start_time = time.time()

            # Check connection and perform a simple query
            health_result = await supabase_client.check_connection()

            response_time = time.time() - start_time

            return {
                "status": health_result.get("status", "unknown"),
                "response_time": response_time,
                "connected": health_result.get("connected", False),
                "url": health_result.get("url", "unknown"),
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time": None,
                "timestamp": datetime.now().isoformat()
            }

    async def check_system_resources(self) -> Dict[str, Any]:
        """Check basic system resources"""
        try:
            import psutil

            return {
                "status": "healthy",
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "timestamp": datetime.now().isoformat()
            }

        except ImportError:
            # psutil not available
            return {
                "status": "unknown",
                "message": "System monitoring not available (psutil not installed)",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def _calculate_overall_health(self, service_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall system health based on individual service health"""
        healthy_count = 0
        total_count = 0
        critical_services = ["github_api", "chroma_db", "supabase"]
        critical_healthy = 0

        for service, result in service_results.items():
            total_count += 1
            status = result.get("status", "unknown")

            if status == "healthy":
                healthy_count += 1
                if service in critical_services:
                    critical_healthy += 1
            elif status == "degraded" and service not in critical_services:
                # Non-critical degraded services still count as partially healthy
                healthy_count += 0.5

        # Determine overall status
        if critical_healthy == len(critical_services) and healthy_count == total_count:
            overall_status = "healthy"
        elif critical_healthy == len(critical_services) and healthy_count >= total_count * 0.7:
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"

        return {
            "status": overall_status,
            "healthy_services": int(healthy_count),
            "total_services": total_count,
            "critical_services_healthy": critical_healthy,
            "health_percentage": (healthy_count / total_count * 100) if total_count > 0 else 0
        }

    def _store_health_history(self, health_report: Dict[str, Any]) -> None:
        """Store health report in history"""
        self.health_history.append(health_report)

        # Keep only recent history
        if len(self.health_history) > self.max_history:
            self.health_history = self.health_history[-self.max_history:]

    def get_health_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get health history for the specified number of hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        return [
            report for report in self.health_history
            if datetime.fromisoformat(report["timestamp"]) > cutoff_time
        ]

    def get_health_summary(self) -> Dict[str, Any]:
        """Get a summary of recent health status"""
        if not self.health_history:
            return {"status": "no_data", "message": "No health data available"}

        recent_reports = self.get_health_history(hours=1)
        if not recent_reports:
            recent_reports = self.health_history[-10:]  # Last 10 reports

        # Calculate uptime percentage
        healthy_reports = sum(1 for report in recent_reports
                            if report["overall"]["status"] == "healthy")
        uptime_percentage = (healthy_reports / len(recent_reports) * 100) if recent_reports else 0

        return {
            "current_status": self.health_history[-1]["overall"]["status"] if self.health_history else "unknown",
            "uptime_percentage": uptime_percentage,
            "total_checks": len(recent_reports),
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "next_check": (self.last_check + self.check_interval).isoformat() if self.last_check else None
        }


# Global health monitor instance
health_monitor = HealthMonitor()
