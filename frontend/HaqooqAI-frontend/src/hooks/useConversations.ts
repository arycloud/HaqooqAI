import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { Conversation } from '@/types/conversation'
import { conversationService } from '@/services/backend/conversationService'
import { generateConversationTitle } from '@/utils/formatters'
import toast from 'react-hot-toast'

export const useConversations = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)
  const conversationsCache = useRef<Map<string, Conversation[]>>(new Map())
  const lastFetchTime = useRef<number>(0)

  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
    }
  }, [user])

  const loadConversations = async (forceRefresh = false) => {
    if (!user) return

    const cacheKey = user.id.toString()
    const now = Date.now()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    // Check cache first (unless force refresh)
    if (!forceRefresh && conversationsCache.current.has(cacheKey) &&
        (now - lastFetchTime.current) < CACHE_DURATION) {
      const cachedData = conversationsCache.current.get(cacheKey)!
      setConversations(cachedData)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await conversationService.getConversations()

      // Update cache
      conversationsCache.current.set(cacheKey, data)
      lastFetchTime.current = now

      setConversations(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(errorMessage)
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (title?: string): Promise<Conversation> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const conversationTitle = title || 'New Conversation'
      const conversation = await conversationService.createConversation(conversationTitle)

      // Add to local state since we don't have realtime
      setConversations(prev => [conversation, ...prev])

      return conversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  const updateConversation = async (
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> => {
    if (!updates.title) return

    try {
      const updatedConversation = await conversationService.updateConversation(conversationId, updates.title)

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? updatedConversation : conv
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      )

      toast.success('Conversation renamed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteConversation = async (conversationId: string): Promise<void> => {
    // TODO: Implement delete endpoint in backend
    console.log('Delete conversation not implemented yet:', conversationId)
  }

  const getConversation = async (conversationId: string): Promise<Conversation | null> => {
    try {
      // Set loading state for this specific conversation
      setLoadingConversationId(conversationId)

      const result = await conversationService.getConversationWithMessages(conversationId)
      return result.conversation
    } catch (err) {
      console.error('Failed to get conversation:', err)
      return null
    } finally {
      setLoadingConversationId(null)
    }
  }

  const selectConversation = (conversationId: string) => {
    // Optimistic UI update - just set loading state, don't clear conversations
    setLoadingConversationId(conversationId)
  }

  const updateConversationTitle = async (conversationId: string, firstMessage: string): Promise<void> => {
    const title = generateConversationTitle(firstMessage)
    await updateConversation(conversationId, { title })
  }

  return {
    conversations,
    loading,
    error,
    loadingConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    updateConversationTitle,
    selectConversation,
    refreshConversations: loadConversations,
  }
}
