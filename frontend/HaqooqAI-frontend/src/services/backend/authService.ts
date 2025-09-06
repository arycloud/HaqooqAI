import axios from 'axios';
import { BACKEND_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import { AuthRequest, AuthResponse, ApiKeyRequest, ApiKeyResponse, TokenExchangeRequest, TokenExchangeResponse, MobileOAuthRequest, MobileOAuthResponse } from '@/types/api';
import { User } from '@/types/auth';

class AuthService {
  /**
   * Authentication Service for HaqooqAI Frontend
   *
   * Supports both web and mobile authentication flows:
   * - Web: Direct redirect to /login/github, callback handled via URL fragment
   * - Mobile: Use startMobileOAuth() and exchangeCodeForToken() methods
   */

  /**
   * Store GitHub token
   */
  storeToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
  }

  /**
   * Get stored GitHub token
   */
  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
  }

  /**
   * Store user data
   */
  storeUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Redirect to GitHub OAuth
   */
  loginWithGitHub(): void {
    const githubAuthUrl = `${BACKEND_URL}${API_ENDPOINTS.GITHUB_LOGIN}`;
    window.location.href = githubAuthUrl;
  }

  /**
   * Exchange authorization code for access token (for mobile apps)
   */
  async exchangeCodeForToken(code: string, state?: string): Promise<{ user: User; quota: any }> {
    try {
      const response = await axios.post<TokenExchangeResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.AUTH_EXCHANGE}`,
        {
          code,
          state: state || undefined
        } as TokenExchangeRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error('Token exchange failed');
      }

      const { access_token, user, quota } = response.data;
      this.storeToken(access_token);

      const userObj: User = {
        id: user.github_id.toString(),
        github_id: user.github_id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        groq_api_key: undefined,
        has_api_key: quota?.has_api_key || false,
        groq_api_key_present: quota?.has_api_key || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.storeUser(userObj);
      return { user: userObj, quota };
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Start mobile OAuth flow (returns auth URL)
   */
  async startMobileOAuth(targetUrl?: string): Promise<{ auth_url: string; state: string }> {
    try {
      const response = await axios.post<MobileOAuthResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.GITHUB_LOGIN_MOBILE}`,
        {
          target: targetUrl
        } as MobileOAuthRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to start mobile OAuth:', error);
      throw new Error('Failed to start mobile OAuth flow');
    }
  }

  /**
   * Validate GitHub token with backend (with retry logic)
   */
  async validateToken(token: string): Promise<{ user: User; quota: any }> {
    const maxRetries = 3
    const retryDelay = 1000 // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.storeToken(token);

        const response = await axios.post<AuthResponse>(
          `${BACKEND_URL}${API_ENDPOINTS.AUTH_VALIDATE}`,
          { github_token: token } as AuthRequest,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
          }
        );

        if (response.data.status !== 'success') {
          throw new Error('Authentication failed');
        }

        const user: User = {
        id: response.data.user.github_id.toString(),
        github_id: response.data.user.github_id,
        username: response.data.user.username,
        email: response.data.user.email,
        avatar_url: response.data.user.avatar_url,
        groq_api_key: undefined, // never store raw key in localStorage
        has_api_key: response.data.quota?.has_api_key || false,
        groq_api_key_present: response.data.quota?.has_api_key || false, // <-- add this line
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

        this.storeUser(user);

        return {
          user,
          quota: response.data.quota,
        };
      } catch (error) {
        console.error(`Token validation attempt ${attempt}/${maxRetries} failed:`, error);
        
        // Check if this is a 502 Bad Gateway or network error
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const isNetworkError = !error.response || status === 502 || status === 503 || status === 504
          
          // For 502 errors specifically, check if it's a database schema issue
          if (status === 502) {
            const errorData = error.response?.data
            if (typeof errorData === 'object' && errorData?.detail) {
              console.warn('502 error with backend details:', errorData.detail)
              // This could be a database schema mismatch (api_key_hash vs encrypted_key)
              if (errorData.detail.includes('api_key_hash') || errorData.detail.includes('does not exist')) {
                console.error('Database schema mismatch detected - backend needs migration')
                throw new Error('Backend database schema needs update - please contact support')
              }
            }
          }
          
          if (isNetworkError && attempt < maxRetries) {
            console.log(`Network error (${status || 'no response'}), retrying in ${retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
            continue // Retry
          }
          
          // For non-retryable errors (401, 403, etc.), fail immediately
          if (status === 401 || status === 403) {
            console.error('Authentication failed - invalid token')
            await this.logout()
            throw new Error('Invalid or expired token')
          }
        }
        
        // If this is the last attempt or non-retryable error, fail
        if (attempt === maxRetries) {
          console.error('All token validation attempts failed')
          await this.logout()
          throw new Error('Authentication service temporarily unavailable')
        }
      }
    }
    
    // This should never be reached
    throw new Error('Authentication failed')
  }

  /**
   * Check existing session on app load
   */
  async checkExistingSession(): Promise<{ user: User; quota: any } | null> {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (!token || !user) {
      return null;
    }

    try {
      return await this.validateToken(token);
    } catch {
      await this.logout();
      return null;
    }
  }

  /**
   * Save user's Groq API key securely
   */
  async saveApiKey(userGithubId: number, apiKey: string): Promise<void> {
    const githubToken = this.getStoredToken();
    if (!githubToken) {
      throw new Error('No GitHub token found');
    }

    try {
      const response = await axios.post<ApiKeyResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.SAVE_API_KEY}`,
        {
          user_id: userGithubId,
          groq_api_key: apiKey,
          github_token: githubToken,
        } as ApiKeyRequest,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error('Failed to save API key');
      }

      console.log('saveApiKey response:', response.data);

      const storedUser = this.getStoredUser();
      if (storedUser) {
        storedUser.has_api_key = true;
        storedUser.groq_api_key = undefined; // never store actual key
        this.storeUser(storedUser);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  async deleteApiKey(userGithubId: number): Promise<void> {
    const githubToken = this.getStoredToken();
    if (!githubToken) throw new Error('No GitHub token found');

    await axios.delete(
      `${BACKEND_URL}${API_ENDPOINTS.DELETE_API_KEY}`,
      {
        headers: { Authorization: `Bearer ${githubToken}` },
        data: { user_id: userGithubId, github_token: githubToken }
      }
    );

    // Update stored user state
    const storedUser = this.getStoredUser();
    if (storedUser) {
      storedUser.has_api_key = false;
      storedUser.groq_api_key = undefined;
      storedUser.groq_api_key_present = false;
      this.storeUser(storedUser);
    }
  }


  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  }
}

export const authService = new AuthService();
