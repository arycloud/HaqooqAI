import axios from 'axios';
import { BACKEND_URL, API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import { AuthRequest, AuthResponse, ApiKeyRequest, ApiKeyResponse } from '@/types/api';
import { User } from '@/types/auth';

class AuthService {
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
   * Handle GitHub OAuth callback
   */
  async handleGitHubCallback(code: string): Promise<{ user: User; quota: any }> {
    try {
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.GITHUB_CALLBACK}?code=${code}`);
      const data = await response.json();

      if (!data.access_token) {
        throw new Error('No access token received');
      }

      this.storeToken(data.access_token);
      return await this.validateToken(data.access_token);
    } catch (error) {
      console.error('GitHub callback failed:', error);
      throw new Error('Failed to complete GitHub authentication');
    }
  }

  /**
   * Validate GitHub token with backend
   */
  async validateToken(token: string): Promise<{ user: User; quota: any }> {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.storeUser(user);

      return {
        user,
        quota: response.data.quota,
      };
    } catch (error) {
      console.error('Token validation failed:', error);
      await this.logout();
      throw new Error('Authentication failed');
    }
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
  async saveApiKey(userId: string, apiKey: string): Promise<void> {
    const githubToken = this.getStoredToken();
    if (!githubToken) {
      throw new Error('No GitHub token found');
    }

    try {
      const response = await axios.post<ApiKeyResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.SAVE_API_KEY}`,
        {
          user_id: parseInt(userId),
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
