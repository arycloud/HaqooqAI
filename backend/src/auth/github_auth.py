"""
GitHub Authentication Service for HaqooqAI Backend
"""
import logging
from typing import Optional
import httpx
from fastapi import HTTPException

from ..models.responses import UserProfile
from ..config import GITHUB_API_URL
from ..database.supabase_client import supabase_client

logger = logging.getLogger(__name__)


class GitHubAuthService:
    """Service for validating GitHub tokens and retrieving user information"""

    def __init__(self):
        self.github_api_url = GITHUB_API_URL
        self.timeout = 10.0  # seconds
        self.db = supabase_client

    async def validate_token(self, token: str) -> UserProfile:
        """
        Validate GitHub token and return user profile information

        Args:
            token: GitHub personal access token

        Returns:
            UserProfile: User information from GitHub

        Raises:
            HTTPException: If token is invalid or API call fails
        """
        if not token:
            raise HTTPException(status_code=401, detail="GitHub token is required")

        # Clean token format
        clean_token = token.strip()
        logger.info(f"Validating token starting with: {clean_token[:10]}...")

        # Accept both Personal Access Tokens (ghp_, github_pat_) and OAuth tokens (gho_)
        if not clean_token.startswith(('ghp_', 'github_pat_', 'gho_')):
            logger.error(f"Invalid token format. Token starts with: {clean_token[:10]}")
            raise HTTPException(status_code=401, detail="Invalid GitHub token format")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.github_api_url}/user",
                    headers={
                        "Authorization": f"token {clean_token}",
                        "Accept": "application/vnd.github.v3+json",
                        "User-Agent": "HaqooqAI-Backend/2.0"
                    }
                )

                if response.status_code == 200:
                    data = response.json()

                    # Validate required fields
                    if not data.get("id") or not data.get("login"):
                        raise HTTPException(
                            status_code=401,
                            detail="Invalid GitHub user data received"
                        )

                    # Create user profile
                    user_profile = UserProfile(
                        github_id=data["id"],
                        username=data["login"],
                        email=data.get("email")  # Email might be None if private
                    )

                    # Store/update user in database
                    try:
                        if self.db.is_connected():
                            self.db.create_or_update_user(
                                github_id=user_profile.github_id,
                                username=user_profile.username,
                                email=user_profile.email
                            )
                            logger.info(f"User {user_profile.username} stored/updated in database")
                        else:
                            logger.warning("Database not connected - user not stored")
                    except Exception as db_error:
                        logger.error(f"Error storing user in database: {db_error}")
                        # Continue without failing - auth can work without DB storage

                    return user_profile

                elif response.status_code == 401:
                    logger.warning(f"Invalid GitHub token attempted")
                    raise HTTPException(
                        status_code=401,
                        detail="GitHub token has expired. Please log in again to continue."
                    )

                elif response.status_code == 403:
                    logger.warning(f"GitHub API rate limit exceeded")
                    raise HTTPException(
                        status_code=429,
                        detail="GitHub API rate limit exceeded. Please try again later."
                    )

                else:
                    logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                    raise HTTPException(
                        status_code=502,
                        detail="GitHub API unavailable. Please try again later."
                    )

        except httpx.TimeoutException:
            logger.error("GitHub API timeout")
            raise HTTPException(
                status_code=504,
                detail="GitHub API timeout. Please try again."
            )

        except httpx.RequestError as e:
            logger.error(f"GitHub API request error: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail="Unable to connect to GitHub API"
            )

        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise

        except Exception as e:
            logger.error(f"Unexpected error in GitHub auth: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal authentication error"
            )

    async def check_github_api_health(self) -> dict:
        """
        Check if GitHub API is accessible

        Returns:
            dict: Health status information
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.github_api_url}/zen",
                    headers={"User-Agent": "HaqooqAI-Backend/2.0"}
                )

                return {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds(),
                    "status_code": response.status_code
                }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time": None,
                "status_code": None
            }
