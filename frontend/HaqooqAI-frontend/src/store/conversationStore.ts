import { create } from 'zustand'
import { Conversation } from '@/types/conversation'

interface ConversationState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  loading: boolean
  error: string | null
}

interface ConversationActions {
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  removeConversation: (id: string) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

type ConversationStore = ConversationState & ConversationActions

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  loading: false,
  error: null,
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  ...initialState,

  setConversations: (conversations) =>
    set({ conversations, error: null }),

  addConversation: (conversation) => {
    const { conversations } = get()
    set({
      conversations: [conversation, ...conversations],
      error: null,
    })
  },

  updateConversation: (id, updates) => {
    const { conversations, currentConversation } = get()
    const updatedConversations = conversations.map((conv) =>
      conv.id === id ? { ...conv, ...updates } : conv
    )
    
    // Sort by updated_at descending
    updatedConversations.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    set({
      conversations: updatedConversations,
      currentConversation:
        currentConversation?.id === id
          ? { ...currentConversation, ...updates }
          : currentConversation,
      error: null,
    })
  },

  removeConversation: (id) => {
    const { conversations, currentConversation } = get()
    set({
      conversations: conversations.filter((conv) => conv.id !== id),
      currentConversation:
        currentConversation?.id === id ? null : currentConversation,
      error: null,
    })
  },

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setLoading: (loading) =>
    set({ loading }),

  setError: (error) =>
    set({ error }),

  reset: () =>
    set({ ...initialState }),
}))

// Selectors
export const useConversations = () => useConversationStore((state) => state.conversations)
export const useCurrentConversation = () => useConversationStore((state) => state.currentConversation)
export const useConversationLoading = () => useConversationStore((state) => state.loading)
export const useConversationError = () => useConversationStore((state) => state.error)
