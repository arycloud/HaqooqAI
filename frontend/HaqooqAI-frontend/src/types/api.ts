import { QuotaInfo } from './auth';
import { Source } from './message';

// Backend API Request Types
export interface AuthRequest {
  github_token: string;
}

export interface QueryRequest {
  query: string;
  user_id: number;  // GitHub user ID
  groq_api_key?: string;  // Optional, backend uses default key otherwise
  gemini_api_key?: string;  // Optional Gemini API key
  openai_api_key?: string;  // Optional OpenAI API key
  conversation_id?: string;
}


export interface MultiProviderApiKeyRequest {
  provider: 'groq' | 'gemini' | 'openai';
  api_key: string;
  github_token: string;
  user_id: number;
}

export interface MultiProviderApiKeyResponse {
  status: string;
  message: string;
  provider: string;
  configured: boolean;
}

export interface ProviderStatus {
  provider: 'groq' | 'gemini' | 'openai';
  configured: boolean;
  valid: boolean;
  last_validated: string | null;
}

export interface AllProvidersResponse {
  status: string;
  providers: ProviderStatus[];
  total_configured: number;
}

export interface RoutingInfo {
  provider: string;
  reason: string;
  message_count: number;
  query_tokens: number;
  using_user_key: boolean;
  estimated_cost?: number;
}


export interface ApiKeyRequest {
  user_id: number;
  groq_api_key: string;
  github_token: string;
}

export interface TokenExchangeRequest {
  code: string;
  state?: string;
}

export interface MobileOAuthRequest {
  target?: string;
}

// Backend API Response Types
export interface AuthResponse {
  status: string;
  user: {
    github_id: number;
    username: string;
    email?: string;
    avatar_url?: string;
  };
  quota: QuotaInfo;
}

export interface AIResponse {
  status: string;
  response: string;
  sources: Source[];
  show_disclaimer: boolean;
  usage: QuotaInfo;
  routing_info?: RoutingInfo;  // New field for routing information
  processing_time?: number;
  query_id?: string;
}

export interface ApiKeyResponse {
  status: string;
  message: string;
  has_unlimited: boolean;
}

export interface TokenExchangeResponse {
  status: string;
  access_token: string;
  user: {
    github_id: number;
    username: string;
    email?: string;
    avatar_url?: string;
  };
  quota: QuotaInfo;
  message?: string;
}

export interface MobileOAuthResponse {
  auth_url: string;
  state: string;
}

export interface QuotaResponse {
  remaining: number;
  limit: number;
  reset_at: string;
  has_api_key: boolean;
  unlimited: boolean;
  provider_quotas?: {
    [provider: string]: {
      remaining: number;
      limit: number;
      reset_at: string;
    };
  };
}

// Environment Variables
export interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
}