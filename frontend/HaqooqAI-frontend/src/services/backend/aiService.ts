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
      // Parse the GitHub user ID and validate it
      const parsedUserId = parseInt(userId, 10)
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        throw new Error('Invalid GitHub user ID')
      }

      // Prepare the request data
      const requestData: QueryRequest = {
        query: query.trim(),
        user_id: parsedUserId,
      }

      // Only add Groq API key if it's provided and valid
      if (groqApiKey && groqApiKey.trim()) {
        if (!groqApiKey.startsWith('gsk_')) {
          throw new Error('Invalid Groq API key format')
        }
        requestData.groq_api_key = groqApiKey.trim()
      }
      
      // Validate query length
      if (!requestData.query || requestData.query.length > 1000) {
        throw new Error('Query must be between 1 and 1000 characters')
      }

      // Debug logging
      console.log('Sending AI request with data:', requestData)
      console.log('Using GitHub token:', githubToken ? 'Token present' : 'No token')

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

      if (response.data.status !== 'success') {
        throw new Error('AI request failed')
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Daily quota exceeded. Please add your own Groq API key for unlimited queries.')
        }
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        }
        if (error.response?.status === 422) {
          throw new Error('Invalid request data. Please ensure you are logged in correctly.')
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The AI service is taking too long to respond.')
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
      throw new Error('Failed to get AI response. Please try again.')
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