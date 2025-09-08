export interface User {
  id: string;
  github_id: number;
  username: string;
  email?: string;
  avatar_url?: string;
  groq_api_key?: string;
  has_api_key?: boolean;
  groq_api_key_present?: boolean;
  api_keys?: {
    groq?: boolean;
    gemini?: boolean;
    openai?: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  email?: string;
  avatar_url?: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  status: string;
  user: User;
  quota: QuotaInfo;
}

export interface QuotaInfo {
  remaining: number;
  limit: number;
  reset_at: string;
  has_api_key: boolean;
  unlimited?: boolean;
  provider_quotas?: {
    [provider: string]: {
      remaining: number;
      limit: number;
      reset_at: string;
    };
  };
}
