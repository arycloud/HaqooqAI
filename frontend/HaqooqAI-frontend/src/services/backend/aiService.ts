import axios from 'axios'
import { BACKEND_URL, API_ENDPOINTS } from '@/utils/constants'
import { QueryRequest, AIResponse, QuotaResponse } from '@/types/api'
import { authService } from './authService'

export class AIService {
  /**
   * Send a question to the AI backend
   */
  async askQuestion(
    query: string,
    userId: string,
    groqApiKey?: string
  ): Promise<AIResponse> {
    const githubToken = authService.getStoredToken()
    if (!githubToken) {
      throw new Error('No authentication token found')
    }

    try {
      // Convert GitHub user ID to number (backend expects a number)
      const parsedUserId = parseInt(userId, 10)
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        throw new Error('Invalid GitHub user ID')
      }

      // Prefer function arg groqApiKey, otherwise fallback to localStorage
      const effectiveGroqKey = groqApiKey?.trim() || localStorage.getItem('groq_api_key')?.trim()

      // Prepare the request data
      const requestData: QueryRequest = {
        query: query.trim(),
        user_id: parsedUserId,
      }

      if (effectiveGroqKey) {
        requestData.groq_api_key = effectiveGroqKey
      }

      // Debug logging
      console.log('Sending AI request with:', {
        query: requestData.query,
        user_id: requestData.user_id,
        has_groq_key: Boolean(requestData.groq_api_key),
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
        throw new Error(response.data.message || 'AI request failed')
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
   * Save user's Groq API key
   */
  async saveApiKey(userId: string, apiKey: string): Promise<void> {
    return authService.saveApiKey(userId, apiKey)
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
