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
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setSendingMessage(true)
      setError(null)

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
      const aiResponse = await aiService.askQuestion(
        content,
        user.id,
        user.groq_api_key
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
      setError(errorMessage)
      toast.error(errorMessage)
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
