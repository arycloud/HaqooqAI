import axios from 'axios'
import { BACKEND_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants'
import { AuthRequest, AuthResponse, ApiKeyRequest, ApiKeyResponse } from '@/types/api'
import { User } from '@/types/auth'

export class AuthService {
  /**
   * Redirect to GitHub OAuth
   */
  loginWithGitHub(): void {
    const githubAuthUrl = `${BACKEND_URL}${API_ENDPOINTS.GITHUB_LOGIN}`
    window.location.href = githubAuthUrl
  }

  /**
   * Validate GitHub token with backend
   */
  async validateToken(token: string): Promise<{ user: User; quota: any }> {
    try {
      const response = await axios.post<AuthResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.AUTH_VALIDATE}`,
        { github_token: token } as AuthRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.status !== 'success') {
        throw new Error('Authentication failed')
      }

      // Convert backend user format to frontend user format
      const user: User = {
        id: response.data.user.github_id.toString(), // Convert to string for frontend
        github_id: response.data.user.github_id,
        username: response.data.user.username,
        email: response.data.user.email || undefined,
        avatar_url: undefined, // Will be populated by backend if needed
        groq_api_key: undefined, // Will be populated separately
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return {
        user,
        quota: response.data.quota,
      }
    } catch (error) {
      console.error('Token validation failed:', error)
      throw new Error('Failed to validate GitHub token')
    }
  }

  /**
   * Handle GitHub OAuth callback
   */
  async handleGitHubCallback(code: string): Promise<{ user: User; quota: any }> {
    try {
      // Exchange code for access token
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.GITHUB_CALLBACK}?code=${code}`)
      const data = await response.json()

      if (!data.access_token) {
        throw new Error('No access token received')
      }

      // Store token
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, data.access_token)

      // Validate token and create user
      return await this.validateToken(data.access_token)
    } catch (error) {
      console.error('GitHub callback failed:', error)
      throw new Error('Failed to complete GitHub authentication')
    }
  }

  /**
   * Save user's Groq API key
   */
  async saveApiKey(userId: string, apiKey: string): Promise<void> {
    const githubToken = this.getStoredToken()
    if (!githubToken) {
      throw new Error('No GitHub token found')
    }

    try {
      const response = await axios.post<ApiKeyResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.SAVE_API_KEY}`,
        {
          user_id: parseInt(userId), // Backend expects number
          groq_api_key: apiKey,
          github_token: githubToken,
        } as ApiKeyRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${githubToken}`,
          },
        }
      )

      if (response.data.status !== 'success') {
        throw new Error('Failed to save API key')
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      throw new Error('Failed to save API key')
    }
  }

  /**
   * Get stored GitHub token
   */
  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN)
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return userData ? JSON.parse(userData) : null
  }

  /**
   * Store user data
   */
  storeUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser()
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION)
  }

  /**
   * Check existing session on app load
   */
  async checkExistingSession(): Promise<{ user: User; quota: any } | null> {
    const token = this.getStoredToken()
    const user = this.getStoredUser()

    if (!token || !user) {
      return null
    }

    try {
      // Validate token is still valid
      return await this.validateToken(token)
    } catch (error) {
      // Token is invalid, clear storage
      await this.logout()
      return null
    }
  }
}

export const authService = new AuthService()
