import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarNewProps {
  isOpen: boolean
}

export function SidebarNew({ isOpen }: SidebarNewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { conversations, createConversation, loading, refreshing } = useConversations()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const getUserInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getAvatarStyle = () => {
    if (user?.avatar_url) {
      return { 
        backgroundImage: `url("${user.avatar_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    } else {
      return {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    }
  }

  const getDisplayName = () => {
    if (user?.username) {
      return user.username
    }
    if (user?.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const handleNewChat = async () => {
    if (isCreating) return
    
    try {
      setIsCreating(true)
      const conversation = await createConversation('New Conversation')
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`)
  }

  const isActiveConversation = (conversationId: string) => {
    return location.pathname === `/chat/${conversationId}`
  }

  const getDisplayTitle = (title: string) => {
    if (title.length > 25) {
      return title.substring(0, 25) + '...'
    }
    return title
  }

  if (!isOpen) return null

  return (
    <aside className="fixed left-0 top-0 flex flex-col w-80 h-full bg-[var(--sidebar-color)] border-r border-[var(--border-color)] p-4 z-40">
      {/* User Profile Section */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="rounded-full size-10 flex-shrink-0"
          style={getAvatarStyle()}
        >
          {!user?.avatar_url && (
            <span>{getUserInitials()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[var(--text-primary)] text-base font-medium leading-normal truncate">
            {getDisplayName()}
          </h1>
          {user?.email && user?.username && (
            <p className="text-[var(--text-secondary)] text-xs truncate">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto scroll-container pr-2">
        <nav className="flex flex-col gap-1">
          {loading ? (
            // Only show spinner on first load with no cached data
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary-color)] border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] text-sm">No conversations yet</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Start a new chat below</p>
            </div>
          ) : (
            // Always show conversations immediately from cache
            <>
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-left w-full transition-colors duration-200",
                    isActiveConversation(conversation.id)
                      ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]"
                      : "hover:bg-[var(--hover-color)]"
                  )}
                >
                  <span className={cn(
                    "material-symbols-outlined text-xl",
                    isActiveConversation(conversation.id)
                      ? "text-[var(--text-primary)]"
                      : "text-slate-400"
                  )}>
                    chat_bubble
                  </span>
                  <p className={cn(
                    "text-sm font-medium leading-normal truncate",
                    isActiveConversation(conversation.id)
                      ? "text-[var(--text-primary)]"
                      : "text-slate-300"
                  )}>
                    {getDisplayTitle(conversation.title)}
                  </p>
                </button>
              ))}
              {refreshing && (
                // Show tiny refreshing indicator at bottom if updating cache
                <div className="flex items-center justify-center py-1 opacity-30">
                  <div className="animate-spin rounded-full h-3 w-3 border border-[var(--primary-color)] border-t-transparent"></div>
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="flex w-full min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="truncate">
            {isCreating ? 'Creating...' : 'New Chat'}
          </span>
        </button>
        
        <div className="mt-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hover-color)] w-full text-left transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[var(--accent-color)]">workspace_premium</span>
            <p className="text-[var(--text-primary)] text-sm font-medium leading-normal">Settings</p>
          </button>
        </div>
      </div>
    </aside>
  )
}