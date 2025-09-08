import { supabase } from './client'
import { Message, CreateMessageRequest } from '@/types/message'

export class MessageService {
  /**
   * Create a new message
   */
  async createMessage(messageData: CreateMessageRequest): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: messageData.conversation_id,
        role: messageData.role,
        content: messageData.content,
        sources: messageData.sources || null,
        disclaimer: messageData.disclaimer || null,  // Add disclaimer if present
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      throw new Error('Failed to create message')
    }

    return data
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      throw new Error('Failed to fetch messages')
    }

    return data || []
  }

  /**
   * Get messages with pagination
   */
  async getMessagesPaginated(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      throw new Error('Failed to fetch messages')
    }

    return data || []
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      throw new Error('Failed to delete message')
    }
  }

  /**
   * Delete all messages in a conversation
   */
  async deleteConversationMessages(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('Error deleting conversation messages:', error)
      throw new Error('Failed to delete conversation messages')
    }
  }

  /**
   * Subscribe to message changes for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe()
  }

  /**
   * Unsubscribe from message changes
   */
  unsubscribeFromMessages(conversationId: string) {
    const channel = supabase.channel(`messages:${conversationId}`)
    return supabase.removeChannel(channel)
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
}

export const messageService = new MessageService()
