import { supabase, setUserContext, clearUserContext } from './client'
import { User, GitHubUser } from '@/types/auth'

export class SupabaseAuthService {
  /**
   * Create or update user in Supabase
   */
  async createOrUpdateUser(githubUser: GitHubUser): Promise<User> {
    const userData = {
      github_id: githubUser.id,
      username: githubUser.login,
      email: githubUser.email,
      avatar_url: githubUser.avatar_url,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'github_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating user:', error)
      throw new Error('Failed to create or update user')
    }

    // Set user context for RLS
    await setUserContext(data.id, data.github_id)

    return data
  }

  /**
   * Get user by GitHub ID
   */
  async getUserByGithubId(githubId: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching user:', error)
      throw new Error('Failed to fetch user')
    }

    return data
  }

  /**
   * Update user's Groq API key
   */
  async updateUserApiKey(userId: string, apiKey: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        groq_api_key: apiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating API key:', error)
      throw new Error('Failed to update API key')
    }

    // Update user quota to reflect API key status
    await this.updateUserQuotaApiKeyStatus(userId, true)
  }

  /**
   * Initialize or get user quota
   */
  async initializeUserQuota(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_quotas')
      .upsert({
        user_id: userId,
        queries_used: 0,
        quota_limit: 5,
        cycle_start: new Date().toISOString(),
        has_api_key: false,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true,
      })

    if (error) {
      console.error('Error initializing user quota:', error)
      throw new Error('Failed to initialize user quota')
    }
  }

  /**
   * Update user quota API key status
   */
  async updateUserQuotaApiKeyStatus(userId: string, hasApiKey: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_quotas')
      .update({ has_api_key: hasApiKey })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating quota API key status:', error)
      throw new Error('Failed to update quota API key status')
    }
  }

  /**
   * Clear user context (logout)
   */
  async logout(): Promise<void> {
    await clearUserContext()
  }
}

export const supabaseAuthService = new SupabaseAuthService()
