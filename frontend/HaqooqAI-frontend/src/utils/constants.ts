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
  AUTH_VALIDATE: '/auth/validate',
  ASK_QUESTION: '/ask/',
  SAVE_API_KEY: '/user/groq-key',
  GET_QUOTA: '/user/quota',
  GITHUB_LOGIN: '/login/github',
  GITHUB_CALLBACK: '/HaqooqAI/callback',
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
