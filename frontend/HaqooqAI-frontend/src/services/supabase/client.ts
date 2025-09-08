import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants'

// Use placeholder values for development if environment variables are not set
const supabaseUrl = SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = SUPABASE_ANON_KEY || 'placeholder_key'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️  Supabase environment variables not set. Using placeholder values for development.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We handle auth manually with GitHub tokens
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper function to set user context for RLS
export const setUserContext = async (userId: string, githubId: number) => {
  await supabase.rpc('set_user_context', {
    user_id: userId,
    github_id: githubId,
  })
}

// Helper function to clear user context
export const clearUserContext = async () => {
  await supabase.rpc('clear_user_context')
}

// Database types (will be generated from Supabase CLI in production)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          github_id: number
          username: string
          email: string | null
          avatar_url: string | null
          groq_api_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          github_id: number
          username: string
          email?: string | null
          avatar_url?: string | null
          groq_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          github_id?: number
          username?: string
          email?: string | null
          avatar_url?: string | null
          groq_api_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          sources: any | null
          disclaimer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          sources?: any | null
          disclaimer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          sources?: any | null
          disclaimer?: string | null
          created_at?: string
        }
      }
      user_quotas: {
        Row: {
          user_id: string
          queries_used: number
          quota_limit: number
          cycle_start: string
          last_query_at: string | null
          has_api_key: boolean
        }
        Insert: {
          user_id: string
          queries_used?: number
          quota_limit?: number
          cycle_start?: string
          last_query_at?: string | null
          has_api_key?: boolean
        }
        Update: {
          user_id?: string
          queries_used?: number
          quota_limit?: number
          cycle_start?: string
          last_query_at?: string | null
          has_api_key?: boolean
        }
      }
    }
  }
}
