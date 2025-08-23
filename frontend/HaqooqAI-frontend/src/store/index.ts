// Export all stores
export * from './authStore'
export * from './conversationStore'
export * from './messageStore'
export * from './uiStore'

// Store reset utility
import { useAuthStore } from './authStore'
import { useConversationStore } from './conversationStore'
import { useMessageStore } from './messageStore'
import { useUIStore } from './uiStore'

export const resetAllStores = () => {
  useAuthStore.getState().reset()
  useConversationStore.getState().reset()
  useMessageStore.getState().reset()
  useUIStore.getState().reset()
}
