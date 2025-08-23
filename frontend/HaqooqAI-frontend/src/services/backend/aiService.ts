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
      const response = await axios.post<AIResponse>(
        `${BACKEND_URL}${API_ENDPOINTS.ASK_QUESTION}`,
        {
          query,
          user_id: parseInt(userId), // Backend expects number
          groq_api_key: groqApiKey,
        } as QueryRequest,
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
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. The AI service is taking too long to respond.')
        }
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
      console.error('Backend health check failed:', error)
      return false
    }
  }

  /**
   * Get backend status
   */
  async getBackendStatus(): Promise<{
    status: string
    services?: Record<string, boolean>
  }> {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 5000,
      })
      return response.data
    } catch (error) {
      console.error('Failed to get backend status:', error)
      return { status: 'error' }
    }
  }
}

export const aiService = new AIService()
