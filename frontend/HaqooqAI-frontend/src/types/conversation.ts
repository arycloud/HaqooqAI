// Re-export Message type for convenience
export type { Message, Source } from './message'

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  error: string | null;
}

export interface CreateConversationRequest {
  title: string;
  user_id: string;
}

export interface UpdateConversationRequest {
  id: string;
  title?: string;
  updated_at?: string;
}
