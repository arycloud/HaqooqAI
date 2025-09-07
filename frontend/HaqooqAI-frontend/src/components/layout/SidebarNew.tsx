import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, Star, Clock3, FolderOpen, Settings, MessageSquare } from 'lucide-react'
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
    updateConversation,
    deleteConversation
  } = useConversations()
  const { user } = useAuth()

  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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
      background: 'var(--gradient-primary)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
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
        const conv = await createConversation("New Conversation")
        if (conv?.id) {
          navigate(`/chat/${conv.id}`)
        } else {
          console.error("Conversation creation failed: no ID returned")
        }
      } catch (err) {
        console.error("Failed to create conversation", err)
      }
    }

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`)
  }

  const handleRename = async (id: string, oldTitle: string) => {
    const newTitle = prompt('Enter new title', oldTitle)
    if (newTitle && newTitle.trim() !== '' && newTitle !== oldTitle) {
      try {
        await updateConversation(id, { title: newTitle })
        refreshConversations()
      } catch (err) {
        console.error('Failed to rename conversation', err)
      }
    }
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id)
    setShowConfirm(true)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteConversation(deleteTarget)
      } catch (err) {
        console.error('Failed to delete conversation', err)
      }
    }
    setShowConfirm(false)
    setDeleteTarget(null)
  }

  const cancelDelete = () => {
    setShowConfirm(false)
    setDeleteTarget(null)
  }

  const isActive = (id: string) => location.pathname === `/chat/${id}`
  const formatDate = (d?: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString() } catch { return '' }
  }

  if (!isOpen) return null

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-full w-80 flex-col panel border-r hairline">
        {/* Brand + Profile */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="rounded-full w-10 h-10 flex-shrink-0" style={avatarStyle}>
            {!user?.avatar_url && initials && <span>{initials}</span>}
          </div>
          <div className="min-w-0">
            {displayName ? (
              <>
                <h1 className="text-[var(--text-primary)] text-base font-medium truncate">
                  {displayName}
                </h1>
                {user?.email && user?.username && (
                  <p className="text-[var(--text-secondary)] text-xs truncate">{user.email}</p>
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
        <div className="flex-grow overflow-y-auto pr-2 pl-4 pb-4">
          <nav className="flex flex-col gap-2 mt-4">
            {loading && (!conversations || conversations.length === 0) ? (
              <div className="py-2 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-[var(--hover-color)]/50 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-sm text-red-400 p-3">Failed to load conversations</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                No conversations yet
              </div>
            ) : (
              <>
                {conversations.map((conversation) => {
                  const active = isActive(conversation.id)
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-xl px-2 py-2 transition-colors",
                        active ? "bg-[var(--hover-color)]/80 ring-1 ring-brand" : "hover:bg-[var(--hover-color)]"
                      )}
                    >
                      <button
                        onClick={() => handleConversationClick(conversation.id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className={cn(
                          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                          active ? "" : "bg-[var(--input-color)]"
                        )}
                          style={active ? { background: 'var(--gradient-primary)' } : {}}
                        >
                          <MessageSquare className={cn("w-4 h-4", active ? "text-white" : "text-slate-300")} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm text-white max-w-[160px]">
                              {conversation.title || 'Untitled'}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              {formatDate(conversation.updated_at || conversation.created_at)}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Row actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRename(conversation.id, conversation.title || 'Untitled')}
                          className="p-1 rounded hover:bg-[var(--hover-color)]"
                          title="Rename"
                        >
                          <Edit2 size={14} className="text-[var(--accent-color)]" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(conversation.id)}
                          className="p-1 rounded hover:bg-[var(--hover-color)]"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-500" />
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
      <div className="mt-auto px-4 pb-4 flex items-center justify-around border-t border-[var(--border-color)] pt-4">
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

        <button
          onClick={() => {
            localStorage.clear()
            navigate('/login')
          }}
          className="p-2 rounded-lg hover:bg-[var(--hover-color)]"
          title="Logout"
        >
          <span className="material-symbols-outlined text-red-500">logout</span>
        </button>
      </div>

      </aside>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="panel rounded-xl shadow-lg p-6 w-80 border hairline">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Delete Conversation</h2>
              <button onClick={cancelDelete} className="text-[var(--text-secondary)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-3 py-1 rounded-lg bg-[var(--hover-color)] text-sm text-[var(--text-secondary)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 rounded-lg bg-red-500 text-sm text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  )
}
