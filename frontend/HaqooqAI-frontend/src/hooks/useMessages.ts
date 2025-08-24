import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useConversations } from './useConversations'
import { Message } from '@/types/message'
import { conversationService } from '@/services/backend/conversationService'
import { aiService } from '@/services/backend/aiService'
import toast from 'react-hot-toast'

export const useMessages = (conversationId?: string) => {
  const { user } = useAuth()
  const { updateConversationTitle } = useConversations()
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    }

    return () => {
      // Cleanup if needed
    }
  }, [conversationId])

  const loadMessages = async (convId: string) => {
    if (!convId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use backend service to get conversation with messages
      const { messages: conversationMessages } = await conversationService.getConversationWithMessages(convId)
      setMessages(prev => ({ ...prev, [convId]: conversationMessages }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (conversationId: string, content: string): Promise<void> => {
    // Check for valid user and github_id
    if (!user || !user.github_id) {
      console.error('Authentication error:', { user })
      throw new Error('Please ensure you are properly logged in')
    }

    try {
      setSendingMessage(true)
      setError(null)

      // Create temporary user message for immediate display
      const tempUserMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user' as const,
        content: content,
        created_at: new Date().toISOString(),
      }

      // Add temporary message to state immediately
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), tempUserMessage]
      }))

      // Create user message via backend
      const userMessage = await conversationService.createMessage(
        conversationId,
        'user',
        content
      )

      // Replace temporary message with actual message from backend
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter(msg => msg.id !== tempUserMessage.id), userMessage]
      }))

      // Update conversation title if this is the first message
      const currentMessages = messages[conversationId] || []
      if (currentMessages.length === 0) {
        await updateConversationTitle(conversationId, content)
      }

      // Get AI response
      if (!user.github_id) {
        throw new Error('GitHub user ID is required. Please ensure you are properly logged in.')
      }

      // Log user info for debugging
      console.log('Sending AI request with:', {
        content,
        github_id: user.github_id,
        has_groq_key: !!user.groq_api_key
      })
      
      // Only pass the API key if it's a valid format (not the placeholder)
      const groqApiKey = user.groq_api_key && user.groq_api_key !== '******' 
        ? user.groq_api_key 
        : undefined
      
      // Use github_id which is guaranteed to be a number
      const aiResponse = await aiService.askQuestion(
        content,
        String(user.github_id),
        groqApiKey
      )

      // Create assistant message via backend
      const assistantMessage = await conversationService.createMessage(
        conversationId,
        'assistant',
        aiResponse.response,
        aiResponse.sources
      )

      // Add assistant message to state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), assistantMessage]
      }))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      console.error('Message sending error:', err)
      setError(errorMessage)
      
      // Show a more user-friendly error message
      if (errorMessage.includes('Invalid Groq API key')) {
        toast.error('Issue with API key. Please check your settings or try without an API key.')
      } else if (errorMessage.includes('authenticated')) {
        toast.error('Session expired. Please log in again.')
        // Could add auto-redirect to login here if needed
      } else {
        toast.error(errorMessage)
      }
      
      throw err
    } finally {
      setSendingMessage(false)
    }
  }

  const deleteMessage = async (_messageId: string): Promise<void> => {
    try {
      // TODO: Implement delete message in backend API
      // await conversationService.deleteMessage(_messageId)
      toast.success('Message deleted')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message'
      toast.error(errorMessage)
      throw err
    }
  }

  const clearConversationMessages = async (conversationId: string): Promise<void> => {
    try {
      // TODO: Implement clear conversation messages in backend API
      // await conversationService.deleteConversationMessages(conversationId)
      setMessages(prev => ({ ...prev, [conversationId]: [] }))
      toast.success('Conversation cleared')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  return {
    messages,
    loading: loading || sendingMessage,
    sendingMessage,
    error,
    sendMessage,
    deleteMessage,
    clearConversationMessages,
    refreshMessages: conversationId ? () => loadMessages(conversationId) : undefined,
  }
}