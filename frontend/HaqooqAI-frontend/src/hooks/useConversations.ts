import { useState } from 'react'
import { useAuth } from './useAuth'
import { Conversation } from '@/types/conversation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/backend/conversationService'
import { generateConversationTitle } from '@/utils/formatters'
import toast from 'react-hot-toast'

const QUERY_KEY = (githubId?: number | string) => ['conversations', githubId ?? 'anon']

export const useConversations = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)

  // ====== Query: conversations list (cached) ======
  const {
    data: conversations = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Conversation[]>({
    queryKey: QUERY_KEY(user?.github_id ?? user?.id),
    queryFn: () => conversationService.getConversations(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // use gcTime instead of cacheTime in React Query v5
    placeholderData: (prev) => prev, // keeps old data visible while refreshing
  })

  // ====== Mutation: create conversation (optimistic add) ======
  const createMutation = useMutation({
    mutationFn: (title: string) => conversationService.createConversation(title),
    onSuccess: (created) => {
      queryClient.setQueryData<Conversation[]>(
        QUERY_KEY(user?.github_id ?? user?.id),
        (old = []) => [created, ...old]
      )
    },
    onError: (err: any) => {
      const msg = err instanceof Error ? err.message : 'Failed to create conversation'
      toast.error(msg)
    }
  })

  // ====== Mutation: update conversation title (optimistic update) ======
  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      conversationService.updateConversation(id, title),
    onMutate: async ({ id, title }) => {
      const key = QUERY_KEY(user?.github_id ?? user?.id)
      await queryClient.cancelQueries({ queryKey: key })

      const previous = queryClient.getQueryData<Conversation[]>(key)
      // optimistic update
      queryClient.setQueryData<Conversation[]>(key, (old = []) =>
        old
          .map((c) => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c))
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      )

      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      // rollback
      if (ctx?.previous) {
        queryClient.setQueryData(QUERY_KEY(user?.github_id ?? user?.id), ctx.previous)
      }
      toast.error('Failed to update conversation')
    },
    onSuccess: () => {
      toast.success('Conversation renamed successfully')
    },
    onSettled: () => {
      // optional: make sure we’re synced with server if other fields changed
      queryClient.invalidateQueries({ queryKey: QUERY_KEY(user?.github_id ?? user?.id) })
    },
  })

  const createConversation = async (title?: string): Promise<Conversation> => {
    if (!user) throw new Error('User not authenticated')
    const conversationTitle = title || 'New Conversation'
    return await createMutation.mutateAsync(conversationTitle)
  }

  const updateConversation = async (
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> => {
    if (!updates.title) return
    await updateMutation.mutateAsync({ id: conversationId, title: updates.title })
  }

  const deleteConversation = async (_conversationId: string): Promise<void> => {
    // TODO: implement backend delete; when ready, also remove from cache:
    // queryClient.setQueryData<Conversation[]>(QUERY_KEY(user?.github_id ?? user?.id), (old = []) =>
    //   old.filter(c => c.id !== _conversationId)
    // )
    console.log('Delete conversation not implemented yet:', _conversationId)
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

  const updateConversationTitle = async (conversationId: string, firstMessage: string): Promise<void> => {
    const title = generateConversationTitle(firstMessage)
    await updateConversation(conversationId, { title })
  }

  return {
    conversations,
    loading: isLoading || isFetching,
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
