import { useState, useMemo } from 'react'
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
  const { conversations, createConversation, loading, refreshing, error } = useConversations()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const initials = useMemo(() => {
    if (user?.username) return user.username.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }, [user])

  const avatarStyle = useMemo(() => {
    if (user?.avatar_url) {
      return {
        backgroundImage: `url("${user.avatar_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } as React.CSSProperties
    }
    return {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px'
    } as React.CSSProperties
  }, [user])

  const displayName = useMemo(() => {
    if (user?.username) return user.username
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }, [user])

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

  const isActiveConversation = (conversationId: string) =>
    location.pathname === `/chat/${conversationId}`

  const getDisplayTitle = (title: string) =>
    title.length > 28 ? title.substring(0, 28) + '…' : title

  if (!isOpen) return null

  return (
    <aside className="fixed left-0 top-0 flex flex-col w-80 h-full bg-[var(--sidebar-color)] border-r border-[var(--border-color)] p-4 z-40">
      {/* Profile */}
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-full size-10 flex-shrink-0" style={avatarStyle}>
          {!user?.avatar_url && <span>{initials}</span>}
        </div>
        <div className="min-w-0">
          <h1 className="text-[var(--text-primary)] text-base font-medium leading-tight truncate">
            {displayName}
          </h1>
          {user?.email && user?.username && (
            <p className="text-[var(--text-secondary)] text-xs truncate">{user.email}</p>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-grow overflow-y-auto scroll-container pr-1">
        <nav className="flex flex-col gap-1">
          {loading && conversations.length === 0 ? (
            // Only on first ever load (no cache)
            <div className="space-y-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 rounded-md bg-[var(--hover-color)]/60 animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] text-sm">No conversations yet</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Start a new chat below</p>
            </div>
          ) : (
            <>
              {conversations.map((c) => {
                const active = isActiveConversation(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => handleConversationClick(c.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 rounded-lg text-left w-full transition-colors duration-150",
                      active
                        ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white"
                        : "hover:bg-[var(--hover-color)]"
                    )}
                  >
                    <span className={cn(
                      "material-symbols-outlined text-base",
                      active ? "text-white" : "text-slate-400"
                    )}>
                      chat_bubble
                    </span>
                    <p className={cn(
                      "text-sm font-medium leading-normal truncate",
                      active ? "text-white" : "text-slate-200"
                    )}>
                      {getDisplayTitle(c.title)}
                    </p>
                  </button>
                )
              })}
              {refreshing && (
                <div className="flex items-center justify-center py-1 opacity-50">
                  <div className="animate-spin rounded-full h-3 w-3 border border-[var(--primary-color)] border-t-transparent" />
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
        <button
          onClick={handleNewChat}
          disabled={isCreating}
          className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white text-sm font-semibold leading-normal hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="truncate">{isCreating ? 'Creating...' : 'New Chat'}</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="mt-2 flex items-center gap-3 px-3 h-10 rounded-lg hover:bg-[var(--hover-color)] w-full text-left transition-colors duration-150"
        >
          <span className="material-symbols-outlined text-[var(--accent-color)]">workspace_premium</span>
          <p className="text-[var(--text-primary)] text-sm font-medium leading-normal">Settings</p>
        </button>
      </div>
    </aside>
  )
}
