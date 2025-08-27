import { QuotaInfo } from './auth';
import { Source } from './message';

// Backend API Request Types
export interface AuthRequest {
  github_token: string;
}

export interface QueryRequest {
  query: string;
  user_id: number;  // GitHub user ID
  groq_api_key?: string;  // Optional, backend uses default key if not provided
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
  usage: QuotaInfo;
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
}

// Environment Variables
export interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
}


