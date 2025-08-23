import { create } from 'zustand'
import { Message } from '@/types/message'

interface MessageState {
  messages: Record<string, Message[]> // conversationId -> messages
  loading: boolean
  sendingMessage: boolean
  error: string | null
}

interface MessageActions {
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  removeMessage: (conversationId: string, messageId: string) => void
  clearConversationMessages: (conversationId: string) => void
  setLoading: (loading: boolean) => void
  setSendingMessage: (sending: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

type MessageStore = MessageState & MessageActions

const initialState: MessageState = {
  messages: {},
  loading: false,
  sendingMessage: false,
  error: null,
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  ...initialState,

  setMessages: (conversationId, messages) => {
    const { messages: currentMessages } = get()
    set({
      messages: {
        ...currentMessages,
        [conversationId]: messages,
      },
      error: null,
    })
  },

  addMessage: (conversationId, message) => {
    const { messages } = get()
    const conversationMessages = messages[conversationId] || []
    
    set({
      messages: {
        ...messages,
        [conversationId]: [...conversationMessages, message],
      },
      error: null,
    })
  },

  updateMessage: (conversationId, messageId, updates) => {
    const { messages } = get()
    const conversationMessages = messages[conversationId] || []
    
    const updatedMessages = conversationMessages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    )

    set({
      messages: {
        ...messages,
        [conversationId]: updatedMessages,
      },
      error: null,
    })
  },

  removeMessage: (conversationId, messageId) => {
    const { messages } = get()
    const conversationMessages = messages[conversationId] || []
    
    const filteredMessages = conversationMessages.filter(
      (msg) => msg.id !== messageId
    )

    set({
      messages: {
        ...messages,
        [conversationId]: filteredMessages,
      },
      error: null,
    })
  },

  clearConversationMessages: (conversationId) => {
    const { messages } = get()
    set({
      messages: {
        ...messages,
        [conversationId]: [],
      },
      error: null,
    })
  },

  setLoading: (loading) =>
    set({ loading }),

  setSendingMessage: (sendingMessage) =>
    set({ sendingMessage }),

  setError: (error) =>
    set({ error }),

  reset: () =>
    set({ ...initialState }),
}))

// Selectors
export const useConversationMessages = (conversationId?: string) =>
  useMessageStore((state) => 
    conversationId ? state.messages[conversationId] || [] : []
  )

export const useMessageLoading = () => useMessageStore((state) => state.loading)
export const useSendingMessage = () => useMessageStore((state) => state.sendingMessage)
export const useMessageError = () => useMessageStore((state) => state.error)
