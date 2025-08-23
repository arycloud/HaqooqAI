export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
}

export interface Source {
  type: 'legal_doc' | 'web_search';
  title: string;
  section?: string;
  reference?: string;
  url?: string;
}

export interface MessageState {
  messages: Record<string, Message[]>; // conversation_id -> messages
  loading: boolean;
  error: string | null;
  sendingMessage: boolean;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

export interface CreateMessageRequest {
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}
