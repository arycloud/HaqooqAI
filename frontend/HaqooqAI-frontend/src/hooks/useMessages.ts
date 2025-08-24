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

      // Add user message to state immediately for better UX
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), userMessage]
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
      
      // Use github_id which is guaranteed to be a number
      const aiResponse = await aiService.askQuestion(
        content,
        String(user.github_id),
        user.groq_api_key || undefined // Pass undefined if no key
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
      console.error('Message sending error:', err)
      
      let errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid Groq API key')) {
        // Clear the invalid API key
        if (user) {
          user.groq_api_key = undefined
          // You might want to also persist this to storage
        }
        errorMessage = 'Invalid API key removed. Your message will be processed with the free tier.'
        // Retry without the API key
        try {
          const aiResponse = await aiService.askQuestion(
            content,
            String(user.github_id),
            undefined
          )
          // If retry succeeds, continue with message processing
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
          return
        } catch (retryErr) {
          errorMessage = 'Failed to process message even without API key'
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      throw new Error(errorMessage)
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
