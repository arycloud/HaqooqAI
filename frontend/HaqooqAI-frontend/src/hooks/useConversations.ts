import { useState, useMemo } from 'react'
import { useAuth } from './useAuth'
import { Conversation } from '@/types/conversation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/backend/conversationService'
import { generateConversationTitle } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { useConversationStore } from '@/store/conversationStore'
import { useNavigate, useLocation } from 'react-router-dom'

const QUERY_KEY = (githubId?: number | string) => ['conversations', githubId ?? 'anon']

export const useConversations = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)

  // Stable query key
  const userQueryKey = useMemo(
    () => ['conversations', user?.github_id ?? user?.id ?? 'guest'],
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
  } = useQuery<Conversation[]>({
    queryKey: userQueryKey,
    queryFn: () => conversationService.getConversations(),
    enabled: !!user,
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

  // ====== Mutation: create conversation ======
  const createMutation = useMutation({
    mutationFn: (title: string) => conversationService.createConversation(title),
    onSuccess: (created) => {
      queryClient.setQueryData<Conversation[]>(
        QUERY_KEY(user?.github_id ?? user?.id),
        (old = []) => [created, ...old]
      )
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create conversation'
      toast.error(msg)
    },
  })

  // ====== Mutation: update conversation title ======
  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      conversationService.updateConversation(id, title),
    onMutate: async ({ id, title }) => {
      const key = QUERY_KEY(user?.github_id ?? user?.id)
      await queryClient.cancelQueries({ queryKey: key })

      const previous = queryClient.getQueryData<Conversation[]>(key)

      queryClient.setQueryData<Conversation[]>(key, (old = []) =>
        old
          .map((c) => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c))
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      )

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QUERY_KEY(user?.github_id ?? user?.id), ctx.previous)
      }
      toast.error('Failed to update conversation')
    },
    onSuccess: () => {
      toast.success('Conversation renamed successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(user?.github_id ?? user?.id) })
    },
  })

  // ====== Mutation: delete conversation ======
  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => conversationService.deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      const previous = queryClient.getQueryData<Conversation[]>(userQueryKey)

      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old.filter((c) => c.id !== conversationId)
      )

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(userQueryKey, ctx.previous)
      }
      toast.error('Failed to delete conversation')
    },
    onSuccess: () => {
      toast.success('Conversation deleted successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey })
    },
  })

  // ====== Functions ======
  const createConversation = async (title?: string): Promise<Conversation> => {
    if (!user) throw new Error('User not authenticated')
    const conversationTitle = title || 'New Conversation'
    try {
      const conversation = await createMutation.mutateAsync(conversationTitle)
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
    if (!updates.title) {
      return Promise.resolve() // ✅ always return Promise<void>
    }
    try {
      await updateMutation.mutateAsync({ id: conversationId, title: updates.title })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(conversationId)
      useConversationStore.getState().removeConversation(conversationId)

      if (location.pathname === `/chat/${conversationId}`) {
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

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

  const selectConversation = (conversationId: string) => {
    setLoadingConversationId(conversationId)
  }

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
    selectConversation,
    refreshConversations: () => refetch(),
  }
}
