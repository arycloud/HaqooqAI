import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { Conversation } from '@/types/conversation'
import { conversationService } from '@/services/backend/conversationService'
import { generateConversationTitle } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { useConversationStore } from '@/store/conversationStore'
import { useNavigate, useLocation } from 'react-router-dom'

const QUERY_KEY = (id?: number | string) => ['conversations', id ?? 'anon']

export const useConversations = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)

  const userQueryKey = useMemo(
    () => QUERY_KEY(user?.github_id ?? user?.id ?? 'guest'),
    [user]
  )

  // ====== Query: conversations list ======
  const {
    data: conversations = [],
    isLoading,
    isFetching,
    error,
    refetch,
    isFetched,
  } = useQuery<Conversation[], Error>({
    queryKey: userQueryKey,
    queryFn: () => conversationService.getConversations(),
    enabled: !!user,
    initialData: () => useConversationStore.getState().conversations || [],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (prev) => prev,
    retry: 2,
    retryDelay: 1000,
    networkMode: 'online',
  })

  // Keep Zustand store synced
  if (conversations.length) {
    try {
      const s = useConversationStore.getState()
      if (s && typeof s.setConversations === 'function') {
        s.setConversations(conversations)
      }
    } catch {
      // ignore if store shape differs
    }
  }

  // ====== Mutation: create conversation ======
  const createConversation = async (title?: string): Promise<Conversation> => {
    if (!user) throw new Error('User not authenticated')
    try {
      const conversationTitle = title || 'New Conversation'
      const conversation = await conversationService.createConversation(conversationTitle)

      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) => [
        conversation,
        ...old,
      ])

      useConversationStore.getState().addConversation(conversation)

      return conversation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  // ====== Mutation: update conversation title ======
  const updateConversation = async (
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> => {
    if (!updates.title) return
    try {
      const updated = await conversationService.updateConversation(conversationId, updates.title)

      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old.map((c) => (c.id === conversationId ? updated : c))
      )

      useConversationStore.getState().updateConversation(conversationId, updated)

      toast.success('Conversation renamed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  // ====== Mutation: delete conversation ======
  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      await conversationService.deleteConversation(conversationId)

      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old.filter((c) => c.id !== conversationId)
      )

      useConversationStore.getState().removeConversation(conversationId)

      if (location.pathname === `/chat/${conversationId}`) {
        navigate('/')
      }

      toast.success('Conversation deleted successfully')
    } catch (error) {
      toast.error('Failed to delete conversation')
      console.error(error)
    }
  }

  // ====== Fetch single conversation ======
  const getConversation = async (conversationId: string): Promise<Conversation | null> => {
    try {
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

  // ====== Update title from first message ======
  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = generateConversationTitle(firstMessage)
    await updateConversation(conversationId, { title })
  }

  return {
    conversations,
    loading: isLoading && !isFetched,
    refreshing: isFetching && isFetched,
    error: error instanceof Error ? error.message : null,
    loadingConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    getConversation,
    updateConversationTitle,
    refreshConversations: () => refetch(),
  }
}
