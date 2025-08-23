import { supabase } from './client'
import { Conversation } from '@/types/conversation'

export class ConversationService {
  /**
   * Create a new conversation
   */
  async createConversation(title: string, userId: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      throw new Error('Failed to create conversation')
    }

    return data
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error('Failed to fetch conversations')
    }

    return data || []
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching conversation:', error)
      throw new Error('Failed to fetch conversation')
    }

    return data
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      throw new Error('Failed to update conversation')
    }

    return data
  }

  /**
   * Update conversation timestamp (when new message is added)
   */
  async touchConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error touching conversation:', error)
      throw new Error('Failed to update conversation timestamp')
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      throw new Error('Failed to delete conversation')
    }
  }

  /**
   * Subscribe to conversation changes
   */
  subscribeToConversations(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }
}

export const conversationService = new ConversationService()
