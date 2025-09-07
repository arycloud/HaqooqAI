import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/backend/conversationService'
import { useConversationStore } from '@/store/conversationStore'
import { Conversation } from '@/types/conversation'

export function useConversations(user?: any) {
  const queryClient = useQueryClient()

  const initialFromStore = useConversationStore.getState().conversations || []

  const {
    data: conversations = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<Conversation[], Error>({
    queryKey: ['conversations', user?.id],
    queryFn: () => conversationService.getConversations(),
    enabled: !!user,
    initialData: initialFromStore,
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

  // keep Zustand store synced
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

  // ✅ update mutation only accepts id + title
  const updateConversation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      conversationService.updateConversation(id, title),
    onSuccess: (updated: Conversation) => {
      queryClient.setQueryData<Conversation[]>(
        ['conversations', user?.id],
        (old = []) => old.map((c) => (c.id === updated.id ? updated : c))
      )

      try {
        const s = useConversationStore.getState()
        if (s && typeof s.setConversations === 'function') {
          s.setConversations(
            (useConversationStore.getState().conversations || []).map((c) =>
              c.id === updated.id ? updated : c
            )
          )
        }
      } catch {
        // ignore
      }
    },
  })

  return {
    conversations,
    isLoading,
    isFetching,
    isError,
    refetch,
    updateConversation,
  }
}
