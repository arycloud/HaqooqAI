import { supabase } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Subscribe to conversation changes
   */
  subscribeToConversations(
    userId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `conversations:${userId}`
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        onInsert || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        onUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        onDelete || (() => {})
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to message changes for a specific conversation
   */
  subscribeToMessages(
    conversationId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onInsert || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onUpdate || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onDelete || (() => {})
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  /**
   * Get channel status
   */
  getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName)
    return channel ? channel.state : null
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

export const realtimeService = new RealtimeService()
