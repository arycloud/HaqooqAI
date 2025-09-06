import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, MoreHorizontal, Crown } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Conversation } from '@/types/conversation'
import { motion } from 'motion/react'

interface SidebarProps {
  isOpen: boolean
}

export function SidebarNew({ isOpen }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const {
    conversations,
    createConversation,
    deleteConversation,
    loading
  }: {
    conversations: Conversation[]
    createConversation: (title?: string) => Promise<Conversation>
    deleteConversation: (id: string) => Promise<void>
    loading: boolean
  } = useConversations()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNewChat = async () => {
    try {
      const conversation = await createConversation()
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    if (deletingId) return
    
    try {
      setDeletingId(conversationId)
      await deleteConversation(conversationId)
      
      // If we're currently viewing this conversation, navigate to home
      if (location.pathname === `/chat/${conversationId}`) {
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    navigate(`/chat/${conversationId}`)
  }

  const isCurrentConversation = (conversationId: string) => {
    return location.pathname === `/chat/${conversationId}`
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  return (
    <aside className="flex flex-col w-80 bg-[var(--sidebar-color)] border-r border-[var(--border-color)] p-4">
      {/* Header with User Profile */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10"
          style={{
            backgroundImage: user?.avatar_url 
              ? `url(${user.avatar_url})` 
              : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpUGhkvdwtrXrOTqAaaB-58kuaDmMK2lpAXk9rNDhmHZfXdLik1y0lrKXMUY51pVBCDC2-vAAAecAF81UZOf6rgBZmh5lhq6tDxyg1JXTEwygsQDbcC-iiRnPE0FfWPiybJAelyjEa10vwtNpEsGpMkwFnD8DpAIRzclOivxma3NJqugFDv2jkw_gDul1J3mUZ7IPascsoSxIYIMz5HupbZds5Ph8qSotlGKjteOHhhqVI0t5JEiJXv83O_kBu5Sb-Wye2sz2tq2w")`
          }}
        />
        <h1 className="text-[var(--text-primary)] text-base font-medium leading-normal">
          {user?.name || user?.login || 'User'}
        </h1>
      </div>

      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto scroll-container pr-2">
        <nav className="flex flex-col gap-1">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-[var(--hover-color)] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">No conversations yet</p>
              <p className="text-[var(--text-secondary)] text-xs mt-1 opacity-70">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <motion.a
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleConversationClick(conversation.id)
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isCurrentConversation(conversation.id)
                    ? "bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)]"
                    : "hover:bg-[var(--hover-color)]"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className={cn(
                  "text-xl flex-shrink-0",
                  isCurrentConversation(conversation.id)
                    ? "text-[var(--text-primary)]"
                    : "text-slate-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium leading-normal truncate",
                    isCurrentConversation(conversation.id)
                      ? "text-[var(--text-primary)]"
                      : "text-slate-300"
                  )}>
                    {conversation.title || 'New Legal Query...'}
                  </p>
                </div>
                
                {/* Delete button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--hover-color)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id)
                      }}
                      className="text-red-600 focus:text-red-600"
                      disabled={deletingId === conversation.id}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deletingId === conversation.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.a>
            ))
          )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto pt-4">
        {/* New Chat Button */}
        <button 
          onClick={handleNewChat}
          disabled={loading}
          className="flex w-full min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">New Chat</span>
        </button>
        
        {/* Upgrade Plan */}
        <div className="mt-2">
          <a 
            href="/settings" 
            onClick={(e) => {
              e.preventDefault()
              handleSettings()
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
          >
            <Crown className="text-[var(--accent-color)] text-xl" />
            <p className="text-[var(--text-primary)] text-sm font-medium leading-normal">Upgrade Plan</p>
          </a>
        </div>
      </div>
    </aside>
  )
}
