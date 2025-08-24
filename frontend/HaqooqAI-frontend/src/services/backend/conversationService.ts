import axios from 'axios'
import { BACKEND_URL, STORAGE_KEYS } from '@/utils/constants'
import { Conversation, Message } from '@/types/conversation'
import { authService } from './authService'

export class ConversationService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    
    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }
    
    try {
      const response = await axios.get(`${BACKEND_URL}/conversations`, {
        params: { user_id: user.github_id },
        headers: {
          'Authorization': `Bearer ${githubToken}`,
        },
      })

      return response.data.conversations.map((conv: any) => ({
        id: conv.id,
        user_id: conv.user_id.toString(),
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      }))
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      throw new Error('Failed to fetch conversations')
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    
    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }
    
    try {
      const response = await axios.post(`${BACKEND_URL}/conversations`, {
        title,
        user_id: user.github_id,
        github_token: githubToken,
      })

      return {
        id: response.data.id,
        user_id: response.data.user_id.toString(),
        title: response.data.title,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw new Error('Failed to create conversation')
    }
  }

  /**
   * Get a conversation with all its messages
   */
  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation
    messages: Message[]
  }> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    
    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }
    
    try {
      const response = await axios.get(`${BACKEND_URL}/conversations/${conversationId}`, {
        params: { user_id: user.github_id },
        headers: {
          'Authorization': `Bearer ${githubToken}`,
        },
      })

      return {
        conversation: {
          id: response.data.conversation.id,
          user_id: response.data.conversation.user_id.toString(),
          title: response.data.conversation.title,
          created_at: response.data.conversation.created_at,
          updated_at: response.data.conversation.updated_at,
        },
        messages: response.data.messages.map((msg: any) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          sources: msg.sources || [],
          created_at: msg.created_at,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
      throw new Error('Failed to fetch conversation')
    }
  }

  /**
   * Create a new message in a conversation
   */
  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: any[]
  ): Promise<Message> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    
    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }
    
    try {
      const response = await axios.post(`${BACKEND_URL}/conversations/${conversationId}/messages`, {
        conversation_id: conversationId,
        role,
        content,
        sources,
        user_id: user.github_id,
        github_token: githubToken,
        has_groq_key: user.has_api_key // <-- use only this flag
      })

      return {
        id: response.data.id,
        conversation_id: response.data.conversation_id,
        role: response.data.role as 'user' | 'assistant',
        content: response.data.content,
        sources: response.data.sources || [],
        created_at: response.data.created_at,
      }
    } catch (error) {
      console.error('Failed to create message:', error)
      throw new Error('Failed to create message')
    }
  }

  /**
   * Update a conversation (currently only title)
   */
  async updateConversation(conversationId: string, title: string): Promise<Conversation> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()

    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }

    try {
      const response = await axios.put(`${BACKEND_URL}/conversations/${conversationId}`, null, {
        params: {
          title,
          user_id: user.github_id
        },
        headers: {
          'Authorization': `Bearer ${githubToken}`,
        },
      })

      return {
        id: response.data.id,
        user_id: response.data.user_id.toString(),
        title: response.data.title,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      }
    } catch (error) {
      console.error('Failed to update conversation:', error)
      throw new Error('Failed to update conversation')
    }
  }
}

export const conversationService = new ConversationService()
