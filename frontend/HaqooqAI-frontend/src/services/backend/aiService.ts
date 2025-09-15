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
          timeout: 10000, // 10 second timeout
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to check quota:', error)
      
      // Handle network timeout errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The server is taking too long to respond. Please try again later.')
      }
      
      // Handle network errors
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      
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
          timeout: 10000, // 10 second timeout
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to save API key')
      }
    } catch (error) {
      console.error('Failed to save API key:', error)
      
      // Handle specific backend validation errors
      if (axios.isAxiosError(error) && error.response?.status === 500) {
        const errorData = error.response?.data
        
        // Check if it's a Pydantic validation error but the key was actually saved
        if (errorData?.detail?.includes?.('validation error') || 
            (typeof errorData === 'string' && errorData.includes('validation error')) ||
            errorData?.detail?.includes?.('has_unlimited') ||
            errorData?.detail?.includes?.('Field required')) {
          
          console.warn('Backend validation error detected, verifying if API key was saved...', {
            provider,
            errorDetail: errorData?.detail,
            responseStatus: error.response?.status
          })
          
          // Try to verify if the key was actually saved by checking provider status
          try {
            await new Promise(resolve => setTimeout(resolve, 1500)) // Brief delay for database consistency
            const statuses = await this.getProviderStatuses(userId)
            const providerStatus = statuses.find(s => s.provider === provider)
            
            if (providerStatus?.configured) {
              console.log(`✅ ${provider} API key was successfully saved despite backend validation error`)
              return // Success! The key was saved despite the response error
            } else {
              console.warn(`❌ ${provider} API key was not found in provider statuses after save attempt`)
            }
          } catch (statusError) {
            console.warn('Could not verify API key status:', statusError)
            // Continue to throw original error
          }
        }
      }
      
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
          timeout: 10000, // 10 second timeout
        }
      )

      return response.data.providers || []
    } catch (error) {
      console.error('Failed to get provider statuses:', error)
      
      // Handle network timeout errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.warn('Provider statuses request timeout, returning empty array')
        return []
      }
      
      // Handle network errors
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('Provider statuses network error, returning empty array')
        return []
      }
      
      // Return empty array instead of throwing to allow graceful degradation
      if (axios.isAxiosError(error) && error.response?.status === 500) {
        console.warn('Backend error when fetching provider statuses, returning empty array')
        return []
      }
      
      // For other errors, still return empty array to prevent app crash
      console.warn('Failed to get provider statuses, returning empty array')
      return []
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
          timeout: 10000, // 10 second timeout
        }
      )

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
      
      // Handle network timeout errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The server is taking too long to respond. Please try again later.')
      }
      
      // Handle network errors
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      
      throw new Error('Failed to delete API key')
    }
  }

  /**
   * Get routing statistics
   */
  async getRoutingStats(): Promise<any> {
    try {
      const response = await axios.get(`${BACKEND_URL}${API_ENDPOINTS.STATS_ROUTING}`, {
        timeout: 10000, // 10 second timeout
      })
      return response.data
    } catch (error) {
      console.error('Failed to get routing stats:', error)
      
      // Handle network timeout errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. The server is taking too long to respond. Please try again later.')
      }
      
      // Handle network errors
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      
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
      // Still return false for any error to indicate health check failure
      return false
    }
  }
}

export const aiService = new AIService()
