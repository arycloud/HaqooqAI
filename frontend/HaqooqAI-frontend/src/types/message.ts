import { AIResponse } from "./api";

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content:  string | AIResponse;
  sources?: Source[];
  created_at: string;
  routing_info?: {
    provider: string;
    reason: string;
    message_count: number;
    query_tokens: number;
    using_user_key: boolean;
    estimated_cost?: number;
  };
  processing_time?: number;
  query_id?: string;
  show_disclaimer?: boolean;  // Show disclaimer based on backend flag
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
  show_disclaimer?: boolean;
}