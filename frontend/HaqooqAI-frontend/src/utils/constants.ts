// API URLs
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ary91-haqooqai-backend.hf.space';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://arycloud.github.io/HaqooqAI';

// Local Storage Keys
export const STORAGE_KEYS = {
  GITHUB_TOKEN: 'github_token',
  USER_DATA: 'user_data',
  CURRENT_CONVERSATION: 'current_conversation',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH_VALIDATE: '/auth/validate',
  AUTH_EXCHANGE: '/auth/exchange', // New: for mobile token exchange
  GITHUB_LOGIN: '/login/github',
  GITHUB_LOGIN_MOBILE: '/login/github/start',
  GITHUB_CALLBACK: '/HaqooqAI/callback',

  // AI and user endpoints
  ASK_QUESTION: '/ask/',


  USER_API_KEYS: '/user/api-keys',  // New: Multi-provider API key management
  USER_API_KEY_PROVIDER: '/user/api-keys',  // Base path for provider-specific operations
  SAVE_API_KEY: '/user/groq-key',  // Legacy: kept for backward compatibility
  DELETE_API_KEY: '/user/groq-key',  // Legacy: kept for backward compatibility
  GET_QUOTA: '/user/quota',

  // Conversation endpoints
  CONVERSATIONS: '/conversations',
  CONVERSATION_MESSAGES: '/conversations', // Base path, append /{id}/messages

  // System endpoints
  HEALTH: '/health',
  STATS: '/stats',
  STATS_ROUTING: '/stats/routing',  // New: Routing statistics
  STATS_CONVERSATIONS: '/stats/conversations',  // New: Conversation statistics
  HEALTH_DETAILED: '/health/detailed',  // New: Detailed health check
} as const;

// App Configuration
export const APP_CONFIG = {
  DEFAULT_QUOTA_LIMIT: 5,
  MAX_QUERY_LENGTH: 1000,
  MESSAGE_PAGINATION_SIZE: 50,
  CONVERSATION_TITLE_MAX_LENGTH: 100,
  AUTO_SAVE_DELAY: 1000, // ms
} as const;

// Legal Prompt Categories
export const LEGAL_CATEGORIES = {
  CIVIL_LAW: 'Civil Law',
  PROPERTY_LAW: 'Property Law',
  LABOR_LAW: 'Labor Law',
  FAMILY_LAW: 'Family Law',
  CRIMINAL_LAW: 'Criminal Law',
  BUSINESS_LAW: 'Business Law',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MESSAGE_MAX_WIDTH: 768,
  TOAST_DURATION: 4000,
} as const;


// LLM Provider Configuration
export const LLM_PROVIDERS = {
  GROQ: 'groq',
  GEMINI: 'gemini',
  OPENAI: 'openai',
} as const;

export const PROVIDER_DISPLAY_NAMES = {
  [LLM_PROVIDERS.GROQ]: 'Groq',
  [LLM_PROVIDERS.GEMINI]: 'Google Gemini',
  [LLM_PROVIDERS.OPENAI]: 'OpenAI',
} as const;

export const PROVIDER_KEY_FORMATS = {
  [LLM_PROVIDERS.GROQ]: {
    prefix: 'gsk_',
    minLength: 20,
    placeholder: 'gsk_...',
  },
  [LLM_PROVIDERS.GEMINI]: {
    prefix: '',
    minLength: 20,
    placeholder: 'Your Gemini API key',
  },
  [LLM_PROVIDERS.OPENAI]: {
    prefix: 'sk-',
    minLength: 20,
    placeholder: 'sk-...',
  },
} as const;