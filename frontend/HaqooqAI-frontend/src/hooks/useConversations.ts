import { useState, useEffect, useRef, useMemo } from 'react'
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
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null)

  // Create a stable key for React Query
  const userQueryKey = useMemo(
    () => ['conversations', user?.github_id ?? user?.id ?? 'guest'],
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
    staleTime: 5 * 60 * 1000,        // 5 minutes: data considered fresh
    gcTime: 30 * 60 * 1000,          // 30 minutes: keep in cache
    refetchOnMount: false,           // ❌ don't refetch every mount
    refetchOnWindowFocus: false,     // ❌ don't block UI when tab focus changes
    refetchOnReconnect: false,       // ❌ don't block UI on reconnect
    placeholderData: (prev) => prev, // ✅ show cached immediately
    retry: 2,
    retryDelay: 1000,
    networkMode: 'online',
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
    try {
      const conversationTitle = title || 'New Conversation'
      const conversation = await conversationService.createConversation(conversationTitle)
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
      await conversationService.updateConversation(conversationId, updates.title)
      toast.success('Conversation renamed successfully')
      refetch() // refresh list after rename
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation'
      toast.error(errorMessage)
      throw err
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => conversationService.deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      // Use userQueryKey for consistency
      await queryClient.cancelQueries({ queryKey: userQueryKey });

      const previous = queryClient.getQueryData<Conversation[]>(userQueryKey);
      // Optimistic update: remove the conversation from the list
      queryClient.setQueryData<Conversation[]>(userQueryKey, (old = []) =>
        old.filter((c) => c.id !== conversationId)
      );

      return { previous };
    },
    onError: (err, conversationId, context) => {
      // Rollback optimistic update on error using userQueryKey
      if (context?.previous) {
        queryClient.setQueryData(userQueryKey, context.previous);
      }
      toast.error('Failed to delete conversation');
    },
    onSuccess: () => {
      toast.success('Conversation deleted successfully');
    },
    onSettled: () => {
      // Optional: Refetch conversations to ensure consistency using userQueryKey
      queryClient.invalidateQueries({ queryKey: userQueryKey });
    },
  });

  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync(conversationId);

      // Remove conversation from Zustand store
      useConversationStore.getState().removeConversation(conversationId);

      // If we're currently viewing this conversation, navigate to home
      if (location.pathname === `/chat/${conversationId}`) {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

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
    loading: isLoading && !isFetched, // Only show loading if first time AND no cached data
    refreshing: isFetching && isFetched, // Show refreshing state when updating cache
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
