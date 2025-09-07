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

  // Stable key for React Query cache
  const userQueryKey = useMemo(
    () => QUERY_KEY(user?.github_id ?? user?.id),
    [user]
  )

  // ====== Query: conversations list (cached) ======
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

  // ====== Mutation: create conversation (optimistic add) ======
  const createMutation = useMutation({
    mutationFn: (title: string) => conversationService.createConversation(title),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      const previous = queryClient.getQueryData<Conversation[]>(userQueryKey)

      const optimisticConversation: Conversation = {
        id: `temp-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.id ?? 'guest',
      }

      // Optimistic add
      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) => [
        optimisticConversation,
        ...old,
      ])

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(userQueryKey, ctx.previous)
      }
      toast.error('Failed to create conversation')
    },
    onSuccess: (created) => {
      // Replace temp with actual
      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) => [
        created,
        ...old.filter((c) => !c.id.startsWith('temp-')),
      ])
    },
  })

  // ====== Mutation: update conversation title (optimistic update) ======
  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      conversationService.updateConversation(id, title),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey })
      const previous = queryClient.getQueryData<Conversation[]>(userQueryKey)

      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old
          .map((c) =>
            c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
          )
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      )

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(userQueryKey, ctx.previous)
      }
      toast.error('Failed to update conversation')
    },
    onSuccess: () => {
      toast.success('Conversation renamed successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKey })
    },
  })

  // ====== Mutation: delete conversation (optimistic remove) ======
  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) =>
      conversationService.deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKey })

      const previous = queryClient.getQueryData<Conversation[]>(userQueryKey)
      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old.filter((c) => c.id !== conversationId)
      )

      return { previous }
    },
    onError: (_err, _id, ctx) => {
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

  // ====== Public API methods ======
  const createConversation = async (title?: string): Promise<Conversation> => {
    if (!user) throw new Error('User not authenticated')
    const conversationTitle = title || 'New Conversation'
    return createMutation.mutateAsync(conversationTitle)
  }

  const updateConversation = async (
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> => {
    if (!updates.title) return
    return updateMutation.mutateAsync({ id: conversationId, title: updates.title })
  }

  const deleteConversation = async (conversationId: string): Promise<void> => {
    await deleteMutation.mutateAsync(conversationId)
    useConversationStore.getState().removeConversation(conversationId)
    if (location.pathname === `/chat/${conversationId}`) {
      navigate('/')
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
