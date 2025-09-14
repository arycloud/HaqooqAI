import axios from 'axios'
import { BACKEND_URL } from '@/utils/constants'
import { Conversation, Message } from '@/types/conversation'
import { authService } from './authService'

export class ConversationService {
  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    if (!githubToken || !user) throw new Error('No authentication found')

    try {
      const response = await axios.get(`${BACKEND_URL}/conversations`, {
        params: { user_id: user.github_id },
        headers: { Authorization: `Bearer ${githubToken}` },
        timeout: 15000, // 15 second timeout (increased from 10s)
      })

      return (response.data.conversations || []).map((conv: any) => ({
        id: conv.id,
        user_id: conv.user_id?.toString?.() ?? String(conv.user_id),
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
      }))
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      
      // Handle server errors gracefully
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 502 || status === 503 || status === 504) {
          // Server temporarily unavailable, return empty array to allow app to continue
          console.warn('Backend temporarily unavailable, returning empty conversations list')
          return []
        }
        if (status === 401) {
          // Token expired, let the axios interceptor handle logout
          // Don't show error here as axios interceptor will handle it
          throw new Error('Authentication expired. Please login again.')
        }
      }
      
      throw new Error('Failed to fetch conversations')
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    if (!githubToken || !user) throw new Error('No authentication found')

    try {
      const response = await axios.post(`${BACKEND_URL}/conversations`, {
        title,
        user_id: user.github_id,
        github_token: githubToken,
      })

      return {
        id: response.data.id,
        user_id: response.data.user_id?.toString?.() ?? String(response.data.user_id),
        title: response.data.title,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      
      // Handle authentication errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, let the axios interceptor handle logout
        // Don't show error here as axios interceptor will handle it
        throw new Error('Authentication expired. Please login again.')
      }
      
      throw new Error('Failed to create conversation')
    }
  }

  /**
   * Get a conversation with all its messages
   */
  async getConversationWithMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<{ conversation: Conversation; messages: Message[] }> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    if (!githubToken || !user) throw new Error('No authentication found')

    try {
      const response = await axios.get(`${BACKEND_URL}/conversations/${conversationId}`, {
        params: { user_id: user.github_id, limit, offset },
        headers: { Authorization: `Bearer ${githubToken}` },
      })

      return {
        conversation: {
          id: response.data.conversation.id,
          user_id: response.data.conversation.user_id?.toString?.() ?? String(response.data.conversation.user_id),
          title: response.data.conversation.title,
          created_at: response.data.conversation.created_at,
          updated_at: response.data.conversation.updated_at,
        },
        messages: (response.data.messages || []).map((msg: any) => {
          // Handle message content that might be a string or object
          let content = msg.content;
          let sources = msg.sources || [];
          let showDisclaimer = msg.show_disclaimer || false;
          
          // Debug: Log the raw message data
          console.log('Raw message data from backend:', { id: msg.id, content: msg.content, sources: msg.sources });
          
          // If content is a string that looks like JSON, try to parse it
          if (typeof msg.content === "string") {
            // Only try to parse as JSON if it looks like JSON (starts with { or [)
            if (msg.content.trim().startsWith('{') || msg.content.trim().startsWith('[')) {
              try {
                const parsedContent = JSON.parse(msg.content);
                // If parsing succeeds and it looks like an AIResponse object
                if (parsedContent && typeof parsedContent === "object" && "response" in parsedContent) {
                  content = parsedContent.response;
                  sources = parsedContent.sources || [];
                  showDisclaimer = parsedContent.show_disclaimer || false;
                }
                // If it's just a regular string that happens to be valid JSON, keep it as is
              } catch (e) {
                // If parsing fails, it's just a regular string response, which is fine
                console.log("Could not parse message content as JSON, using raw string.", e);
              }
            }
            // If it doesn't look like JSON, treat it as a regular string (no action needed)
          } else if (typeof msg.content === "object" && msg.content !== null) {
            // If content is already an object, extract the fields
            content = msg.content.response || msg.content;
            sources = msg.content.sources || [];
            showDisclaimer = msg.content.show_disclaimer || false;
          }

          // Debug: Log the processed message data
          console.log('Processed message data:', { id: msg.id, content, sources, showDisclaimer });

          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            role: msg.role as 'user' | 'assistant',
            content,
            sources,
            show_disclaimer: showDisclaimer,
            created_at: msg.created_at,
          };
        }),

      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
      
      // Handle authentication errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, let the axios interceptor handle logout
        // Don't show error here as axios interceptor will handle it
        throw new Error('Authentication expired. Please login again.')
      }
      
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
    if (!githubToken || !user) throw new Error('No authentication found')

    try {
      // Handle content that might be an object or string
      let processedContent = content;
      let showDisclaimer = false;
      let processedSources = sources || [];
      
      // If content is an AIResponse object, extract the fields
      if (typeof content === "object" && content !== null && "response" in content) {
        processedContent = (content as any).response;
        processedSources = (content as any).sources || [];
        showDisclaimer = (content as any).show_disclaimer || false;
      } else if (typeof content === "object" && content !== null) {
        // If content is some other object, serialize it
        processedContent = JSON.stringify(content);
      }

      const response = await axios.post(`${BACKEND_URL}/conversations/${conversationId}/messages`, {
        conversation_id: conversationId,
        role,
        content: processedContent,
        sources: processedSources,
        show_disclaimer: showDisclaimer,
        user_id: user.github_id,
        github_token: githubToken,
      })

      // Handle the response content as well
      let responseContent = response.data.content;
      let responseSources = response.data.sources || [];
      let responseShowDisclaimer = response.data.show_disclaimer || false;
      
      // If content is a string that looks like JSON, try to parse it
      if (typeof response.data.content === "string") {
        // Only try to parse as JSON if it looks like JSON (starts with { or [)
        if (response.data.content.trim().startsWith('{') || response.data.content.trim().startsWith('[')) {
          try {
            const parsedContent = JSON.parse(response.data.content);
            // If parsing succeeds and it looks like an AIResponse object
            if (parsedContent && typeof parsedContent === "object" && "response" in parsedContent) {
              responseContent = parsedContent.response;
              responseSources = parsedContent.sources || [];
              responseShowDisclaimer = parsedContent.show_disclaimer || false;
            }
            // If it's just a regular string that happens to be valid JSON, keep it as is
          } catch (e) {
            // If parsing fails, it's just a regular string response, which is fine
            console.log("Could not parse message content as JSON, using raw string.", e);
          }
        }
        // If it doesn't look like JSON, treat it as a regular string (no action needed)
      } else if (typeof response.data.content === "object" && response.data.content !== null) {
        // If content is already an object, extract the fields
        responseContent = response.data.content.response || response.data.content;
        responseSources = response.data.content.sources || [];
        responseShowDisclaimer = response.data.content.show_disclaimer || false;
      }

      return {
        id: response.data.id,
        conversation_id: response.data.conversation_id,
        role: response.data.role as 'user' | 'assistant',
        content: responseContent,
        sources: responseSources,
        show_disclaimer: responseShowDisclaimer,
        created_at: response.data.created_at,
      }
    } catch (error) {
      console.error('Failed to create message:', error)
      
      // Handle authentication errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, let the axios interceptor handle logout
        // Don't show error here as axios interceptor will handle it
        throw new Error('Authentication expired. Please login again.')
      }
      
      throw new Error('Failed to create message')
    }
  }

  /**
   * Update a conversation (currently only title)
   */
  async updateConversation(conversationId: string, title: string): Promise<Conversation> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()
    if (!githubToken || !user) throw new Error('No authentication found')

    try {
      const response = await axios.put(`${BACKEND_URL}/conversations/${conversationId}`, null, {
        params: { title, user_id: user.github_id },
        headers: { Authorization: `Bearer ${githubToken}` },
      })

      return {
        id: response.data.id,
        user_id: response.data.user_id?.toString?.() ?? String(response.data.user_id),
        title: response.data.title,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
      }
    } catch (error) {
      console.error('Failed to update conversation:', error)
      
      // Handle authentication errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, let the axios interceptor handle logout
        // Don't show error here as axios interceptor will handle it
        throw new Error('Authentication expired. Please login again.')
      }
      
      throw new Error('Failed to update conversation')
    }
  }

    /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const githubToken = authService.getStoredToken()
    const user = authService.getStoredUser()

    if (!githubToken || !user) {
      throw new Error('No authentication found')
    }

    try {
      await axios.delete(`${BACKEND_URL}/conversations/${conversationId}`, {
        params: { user_id: user.github_id },
        headers: {
          'Authorization': `Bearer ${githubToken}`,
        },
      })
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      
      // Handle authentication errors
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, let the axios interceptor handle logout
        // Don't show error here as axios interceptor will handle it
        throw new Error('Authentication expired. Please login again.')
      }
      
      throw new Error('Failed to delete conversation')
    }
  }

}

export const conversationService = new ConversationService()