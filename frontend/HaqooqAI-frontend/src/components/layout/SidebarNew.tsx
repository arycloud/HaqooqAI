import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarNewProps {
  isOpen: boolean
}

export default function SidebarNew({ isOpen }: SidebarNewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    conversations,
    loading,
    refreshing,
    error,
    createConversation,
    refreshConversations,
    updateConversationTitle,
    deleteConversation
  } = useConversations()
  const { user } = useAuth()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const initials = useMemo(() => {
    if (user?.username) return user.username.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return ''
  }, [user])

  const avatarStyle = useMemo<React.CSSProperties>(() => {
    if (user?.avatar_url) {
      return {
        backgroundImage: `url("${user.avatar_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px'
    }
  }, [user])

  const displayName = useMemo(() => {
    if (user?.username) return user.username
    if (user?.email) return user.email.split('@')[0]
    return ''
  }, [user])

  useEffect(() => {
    if (isOpen && (!conversations || conversations.length === 0)) {
      refreshConversations()
    }
  }, [isOpen, conversations, refreshConversations])

  const handleNewChat = async () => {
    try {
      const conv = await createConversation('New Conversation')
      navigate(`/chat/${conv.id}`)
    } catch (err) {
      console.error('Failed to create conversation', err)
    }
  }

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`)
  }

  const handleRename = (id: string, title: string) => {
    setEditingId(id)
    setEditValue(title)
  }

  const handleRenameSubmit = async (id: string) => {
    if (editValue.trim()) {
      await updateConversationTitle(id, editValue.trim())
    }
    setEditingId(null)
    setEditValue('')
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id)
    }
  }

  const isActive = (id: string) => location.pathname === `/chat/${id}`

  const formatDate = (d?: string) => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return ''
    }
  }

  if (!isOpen) return null

  return (
    <aside className="fixed left-0 top-0 flex flex-col w-80 h-full bg-[var(--sidebar-color)] border-r border-[var(--border-color)] p-4 z-40">
      {/* Profile */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full w-10 h-10 flex-shrink-0" style={avatarStyle}>
          {!user?.avatar_url && initials && <span>{initials}</span>}
        </div>
        <div className="flex-1 min-w-0">
          {displayName ? (
            <>
              <h1 className="text-[var(--text-primary)] text-base font-medium leading-normal truncate">
                {displayName}
              </h1>
              {user?.email && user?.username && (
                <p className="text-[var(--text-secondary)] text-xs truncate">
                  {user.email}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-1">
              <div className="h-4 w-28 bg-[var(--hover-color)]/40 rounded animate-pulse" />
              <div className="h-3 w-40 bg-[var(--hover-color)]/30 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-grow overflow-y-auto scroll-container pr-2">
        <nav className="flex flex-col gap-2">
          {loading && (!conversations || conversations.length === 0) ? (
            <div className="py-2 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-[var(--hover-color)]/50 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 p-3">Failed to load conversations</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] text-sm">No conversations yet</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Start a new chat below</p>
            </div>
          ) : (
            <>
              {conversations.map((conversation) => {
                const active = isActive(conversation.id)
                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group",
                      active
                        ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white"
                        : "hover:bg-[var(--hover-color)]"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-base flex-shrink-0",
                        active ? "text-white" : "text-slate-400"
                      )}
                    >
                      chat_bubble
                    </span>

                    <div className="flex-1 min-w-0">
                      {editingId === conversation.id ? (
                        <input
                          type="text"
                          className="w-full text-sm bg-transparent border-b border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-color)]"
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleRenameSubmit(conversation.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(conversation.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                      ) : (
                        <button
                          className={cn(
                            "block text-sm font-medium truncate text-left w-full",
                            active ? "text-white" : "text-slate-200"
                          )}
                          onClick={() => handleConversationClick(conversation.id)}
                        >
                          {conversation.title || 'Untitled'}
                        </button>
                      )}
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {formatDate(conversation.updated_at || conversation.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="material-symbols-outlined text-sm text-[var(--text-secondary)] hover:text-blue-500"
                        title="Rename"
                        onClick={() => handleRename(conversation.id, conversation.title || 'Untitled')}
                      >
                        edit
                      </button>
                      <button
                        className="material-symbols-outlined text-sm text-[var(--text-secondary)] hover:text-red-500"
                        title="Delete"
                        onClick={() => handleDelete(conversation.id)}
                      >
                        delete
                      </button>
                    </div>
                  </div>
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

      {/* Bottom actions */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleNewChat}
          className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-bold leading-normal transition-opacity hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">New Chat</span>
        </button>

        {/* Icons only */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-[var(--hover-color)]"
            title="Dashboard"
          >
            <span className="material-symbols-outlined text-[var(--accent-color)]">dashboard</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-[var(--hover-color)]"
            title="Settings"
          >
            <span className="material-symbols-outlined text-[var(--accent-color)]">settings</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
