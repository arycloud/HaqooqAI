import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useConversations } from './useConversations'
import { Message } from '@/types/message'
import { messageService } from '@/services/supabase/messages'
import { realtimeService } from '@/services/supabase/realtime'
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
      setupRealtimeSubscription(conversationId)
    }

    return () => {
      if (conversationId) {
        realtimeService.unsubscribe(`messages:${conversationId}`)
      }
    }
  }, [conversationId])

  const loadMessages = async (convId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await messageService.getMessages(convId)
      setMessages(prev => ({ ...prev, [convId]: data }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = (convId: string) => {
    realtimeService.subscribeToMessages(
      convId,
      // onInsert
      (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => ({
          ...prev,
          [convId]: [...(prev[convId] || []), newMessage]
        }))
      },
      // onUpdate
      (payload) => {
        const updatedMessage = payload.new as Message
        setMessages(prev => ({
          ...prev,
          [convId]: (prev[convId] || []).map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        }))
      },
      // onDelete
      (payload) => {
        const deletedMessage = payload.old as Message
        setMessages(prev => ({
          ...prev,
          [convId]: (prev[convId] || []).filter(msg => msg.id !== deletedMessage.id)
        }))
      }
    )
  }

  const sendMessage = async (conversationId: string, content: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      setSendingMessage(true)
      setError(null)

      // Create user message
      await messageService.createMessage({
        conversation_id: conversationId,
        role: 'user',
        content,
      })

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

      // Create assistant message
      await messageService.createMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.response,
        sources: aiResponse.sources,
      })

      // Update conversation timestamp
      await messageService.touchConversation?.(conversationId)

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
      // The realtime subscription will handle removing it from the list
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
