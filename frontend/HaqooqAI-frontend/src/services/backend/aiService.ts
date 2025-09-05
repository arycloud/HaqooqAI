import axios from 'axios'
import { BACKEND_URL, API_ENDPOINTS } from '@/utils/constants'
import { QueryRequest, AIResponse, QuotaResponse, MultiProviderApiKeyResponse,
  MultiProviderApiKeyRequest,
  ProviderStatus,
  AllProvidersResponse
 } from '@/types/api'
import { authService } from './authService'

export class AIService {
  /**
   * Send a question to the AI backend
   */
  async askQuestion(
    query: string,
    userId: string,
    conversationId: string,
    apiKeys?: {
      groq?: string;
      gemini?: string;
      openai?: string;
    }
  ): Promise<AIResponse> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      const requestData: QueryRequest = {
        query,
        user_id: parseInt(userId),
        conversation_id: conversationId,
      }

      // Add API keys if provided
      if (apiKeys?.groq) {
        requestData.groq_api_key = apiKeys.groq
      }
      if (apiKeys?.gemini) {
        requestData.gemini_api_key = apiKeys.gemini
      }
      if (apiKeys?.openai) {
        requestData.openai_api_key = apiKeys.openai
      }

      // Fallback to stored Groq key for backward compatibility
      if (!apiKeys?.groq && !apiKeys?.gemini && !apiKeys?.openai) {
        const storedUser = authService.getStoredUser()
        const effectiveGroqKey = storedUser?.groq_api_key
        if (effectiveGroqKey) {
          requestData.groq_api_key = effectiveGroqKey
        }
      }

      // Debug logging
      console.log('Sending AI request with:', {
        query: requestData.query,
        user_id: requestData.user_id,
        has_groq_key: Boolean(requestData.groq_api_key),
        has_gemini_key: Boolean(requestData.gemini_api_key),
        has_openai_key: Boolean(requestData.openai_api_key),
        conversation_id: requestData.conversation_id,
      })

      // Validation checks
      if (!requestData.query || requestData.query.length === 0) {
        throw new Error('Query must contain at least 1 character')
      }

      if (requestData.query.length > 1000) {
        throw new Error('Query must not exceed 1000 characters')
      }

      const response = await axios.post<AIResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.ASK_QUESTION}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      )

      console.log('AI service response:', response)

      if (response.data.status !== 'success') {
        throw new Error(response.data.response || 'AI request failed')
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const detail = error.response?.data?.detail

        if (status === 429) throw new Error(detail || 'Query quota exceeded')
        if (status === 401) throw new Error('Authentication failed. Please login again.')
        if (status === 422) throw new Error(detail || 'Invalid request data')
        if (status === 400) throw new Error(detail || 'Invalid request')
        if (status === 503) throw new Error(detail || 'Service temporarily unavailable. Try again later.')
        if (status === 500) throw new Error(detail || 'AI service error')
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The AI service is taking too long to respond.')
        }

        console.error('AI service error details:', {
          status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          request: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          },
        })
      }

      console.error('AI service error:', error)
      throw error instanceof Error
        ? error
        : new Error('Failed to get AI response. Please try again.')
    }
  }

  /**
   * Check user quota
   */
  async checkQuota(userId: string): Promise<QuotaResponse> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      const response = await axios.get<QuotaResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.GET_QUOTA}/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to check quota:', error)
      throw new Error('Failed to check quota')
    }
  }

/**
   * Save API key for a specific provider
   */
  async saveProviderApiKey(
    userId: string, 
    provider: 'groq' | 'gemini' | 'openai', 
    apiKey: string
  ): Promise<void> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      const response = await axios.post<MultiProviderApiKeyResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.USER_API_KEYS}`,
        {
          provider,
          api_key: apiKey,
          github_token: githubToken,
          user_id: parseInt(userId),
        } as MultiProviderApiKeyRequest,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      throw new Error('Failed to save API key')
    }
  }

  /**
   * Get all provider statuses
   */
  async getProviderStatuses(userId: string): Promise<ProviderStatus[]> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      const response = await axios.get<AllProvidersResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.USER_API_KEYS}`,
        {
          params: {
            user_id: parseInt(userId),
            github_token: githubToken,
          },
          headers: {
            'Authorization': `Bearer ${githubToken}`,
          },
        }
      )

      return response.data.providers
    } catch (error) {
      console.error('Failed to get provider statuses:', error)
      throw new Error('Failed to get provider statuses')
    }
  }

  /**
   * Delete API key for a specific provider
   */
  async deleteProviderApiKey(
    userId: string, 
    provider: 'groq' | 'gemini' | 'openai'
  ): Promise<void> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      const response = await axios.delete<MultiProviderApiKeyResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.USER_API_KEY_PROVIDER}/${provider}`,
        {
          data: {
            github_token: githubToken,
            user_id: parseInt(userId),
          },
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
      throw new Error('Failed to delete API key')
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(): Promise<any> {
    try {
      const response = await axios.get(`${BACKEND_URL}${API_ENDPOINTS.STATS_ROUTING}`)
      return response.data
    } catch (error) {
      console.error('Failed to get routing stats:', error)
      throw new Error('Failed to get routing statistics')
    }
  }

  // Keep legacy methods for backward compatibility
  async saveApiKey(userId: string, apiKey: string): Promise<void> {
    return this.saveProviderApiKey(userId, 'groq', apiKey)
  }

  /**
   * Test if the backend is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 5000,
      })
      return response.status === 200
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

export const aiService = new AIService()
