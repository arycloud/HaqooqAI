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
  const { conversations, createConversation, loading } = useConversations()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

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
    <aside className="flex flex-col w-80 bg-[var(--sidebar-color)] border-r border-[var(--border-color)] p-4">
      {/* User Profile Section */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
          style={{
            backgroundImage: user?.avatar_url 
              ? `url("${user.avatar_url}")` 
              : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpUGhkvdwtrXrOTqAaaB-58kuaDmMK2lpAXk9rNDhmHZfXdLik1y0lrKXMUY51pVBCDC2-vAAAecAF81UZOf6rgBZmh5lhq6tDxyg1JXTEwygsQDbcC-iiRnPE0FfWPiybJAelyjEa10vwtNpEsGpMkwFnD8DpAIRzclOivxma3NJqugFDv2jkw_gDul1J3mUZ7IPascsoSxIYIMz5HupbZds5Ph8qSotlGKjteOHhhqVI0t5JEiJXv83O_kBu5Sb-Wye2sz2tq2w")`
          }}
        />
        <h1 className="text-[var(--text-primary)] text-base font-medium leading-normal">
          {user?.username || user?.email || 'User'}
        </h1>
      </div>

      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto scroll-container pr-2">
        <nav className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--primary-color)] border-t-transparent"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] text-sm">No conversations yet</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1">Start a new chat below</p>
            </div>
          ) : (
            conversations.map((conversation) => (
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
            ))
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