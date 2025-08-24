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

      // Prepare the request data
      const requestData: QueryRequest = {
        query: query.trim(),
        user_id: parsedUserId,
      }

      // Only add API key if it's provided and not empty
      if (groqApiKey?.trim()) {
        requestData.groq_api_key = groqApiKey.trim()
      }

      // Log request for debugging (matches backend's logging)
      console.log('Sending AI request with:', {
        content: requestData.query,
        github_id: requestData.user_id,
        // has_groq_key: Boolean(requestData.groq_api_key)
      })
      
      // Validate query length (ensure minimum length of 1 character)
      if (!requestData.query || requestData.query.length === 0) {
        throw new Error('Query must contain at least 1 character')
      }
      
      // Limit to 1000 characters as per backend requirements
      if (requestData.query.length > 1000) {
        throw new Error('Query must not exceed 1000 characters')
      }

      // Debug logging
      console.log('Sending AI request with data:', requestData)
      console.log('Using GitHub token:', githubToken ? 'Token present' : 'No token')

      // Also log any client-side stored flags for debugging
      try {
        const storedUserRaw = localStorage.getItem('user_data')
        if (storedUserRaw) {
          const storedUser = JSON.parse(storedUserRaw)
          console.log('Stored user flags:', {
            has_api_key: storedUser?.has_api_key,
            groq_api_key_present: storedUser?.groq_api_key_present || storedUser?.has_api_key,
          })
        }
      } catch (e) {
        // ignore parse errors
      }

      const response = await axios.post<AIResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.ASK_QUESTION}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for AI responses
        }
      )

      // Log the full response for debugging
      console.log('AI service response:', response)

      if (response.data.status !== 'success') {
        throw new Error('AI request failed')
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle error cases exactly as they come from the backend
        if (error.response?.status === 429) {
          const detail = error.response?.data?.detail || 'Query quota exceeded'
          throw new Error(detail)
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        if (error.response?.status === 422) {
          const detail = error.response?.data?.detail || 'Invalid request data'
          throw new Error(detail)
        }
        if (error.response?.status === 400) {
          const detail = error.response?.data?.detail || 'Invalid request'
          throw new Error(detail)
        }
        if (error.response?.status === 503) {
          const detail = error.response?.data?.detail || 'AI service error'
          throw new Error(detail)
        }
        if (error.response?.status === 500) {
          const detail = error.response?.data?.detail || 'AI service error'
          throw new Error(detail)
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The AI service is taking too long to respond.')
        }
        // Handle service unavailable error specifically
        if (error.response?.status === 503) {
          throw new Error('Service temporarily unavailable. The AI service is currently experiencing issues. Please try again later or provide your own Groq API key for a more reliable connection.')
        }
        // Log more detailed error information for debugging
        console.error('AI service error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          }
        })
      }
      
      console.error('AI service error:', error)
      // Provide a more informative default error message
      if (error instanceof Error && error.message) {
        throw error;
      } else {
        throw new Error('Failed to get AI response. Please try again.')
      }
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