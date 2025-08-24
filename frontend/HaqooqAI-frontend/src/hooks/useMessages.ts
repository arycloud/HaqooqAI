import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useConversations } from './useConversations'
import { Message } from '@/types/message'
import { conversationService } from '@/services/backend/conversationService'
import { aiService } from '@/services/backend/aiService'
import { authService } from '@/services/backend/authService'
import toast from 'react-hot-toast'

export const useMessages = (conversationId?: string) => {
  const { user } = useAuth()
  const { updateConversationTitle } = useConversations()
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // To prevent race conditions when conversation changes
  const activeConversationRef = useRef<string | null>(conversationId || null)

  useEffect(() => {
    if (conversationId) {
      activeConversationRef.current = conversationId
      loadMessages(conversationId)
    }
    return () => {
      activeConversationRef.current = null
    }
  }, [conversationId])

  const loadMessages = async (convId: string) => {
    if (!convId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { messages: conversationMessages } =
        await conversationService.getConversationWithMessages(convId)

      // Only update if still on the same conversation
      if (activeConversationRef.current === convId) {
        setMessages(prev => ({ ...prev, [convId]: conversationMessages }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
      setError(errorMessage)
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (convId: string, content: string): Promise<void> => {
    try {
      if (!convId) throw new Error('No conversation selected')

      setSendingMessage(true)
      setError(null)

      // Ensure user is authenticated
      let currentUser = user
      if (!currentUser?.github_id) {
        const session = await authService.checkExistingSession()
        if (!session?.user) {
          console.error('Authentication error:', { user })
          throw new Error('Please ensure you are properly logged in')
        }
        currentUser = session.user
      }

      const activeUser = currentUser!
      const githubId = String(activeUser.github_id)

      // Temporary user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: convId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), tempUserMessage],
      }))

      // Create user message in backend
      const userMessage = await conversationService.createMessage(
        convId,
        'user',
        content
      )

      setMessages(prev => ({
        ...prev,
        [convId]: [
          ...(prev[convId] || []).filter(m => m.id !== tempUserMessage.id),
          userMessage,
        ],
      }))

      // Update title if this is the very first message
      setMessages(prev => {
        const current = prev[convId] || []
        if (current.length === 1) {
          updateConversationTitle(convId, content)
        }
        return prev
      })

      console.log('Sending AI request with:', { content, github_id: githubId })

      // Ask AI
      const aiResponse = await aiService.askQuestion(content, githubId)

      // Create assistant message via backend
      const assistantMessage = await conversationService.createMessage(
        convId,
        'assistant',
        aiResponse.response,
        aiResponse.sources
      )

      setMessages(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), assistantMessage],
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      console.error('Message sending error:', err)
      setError(errorMessage)

      if (errorMessage.includes('Invalid Groq API key')) {
        toast.error('Issue with API key. Please check your settings or try without an API key.')
      } else if (errorMessage.includes('authenticated')) {
        toast.error('Session expired. Please log in again.')
      } else if (errorMessage.includes('Service temporarily unavailable')) {
        toast.error('The AI service is temporarily unavailable. Try again later or use your own Groq API key.')
      } else if (errorMessage.includes('quota exceeded')) {
        toast.error('Daily quota exceeded. Please add your own Groq API key for unlimited queries.')
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
      toast.success('Message deleted')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message'
      toast.error(errorMessage)
      throw err
    }
  }

  const clearConversationMessages = async (convId: string): Promise<void> => {
    try {
      // TODO: Implement clear conversation messages in backend API
      setMessages(prev => ({ ...prev, [convId]: [] }))
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
