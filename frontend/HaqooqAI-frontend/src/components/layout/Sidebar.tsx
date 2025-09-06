import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Scale, Plus, MessageSquare, Trash2, MoreHorizontal, Menu, Settings, LogOut, User } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatConversationDate } from '@/utils/formatters'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QuotaBadge } from './QuotaBadge'
import { Conversation } from '@/types/conversation'

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
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

  const isChatRoute = location.pathname.startsWith('/chat/')

  const handleLogout = async () => {
    await logout()
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  const handleNewChat = async () => {
    try {
      const conversation = await createConversation('New Conversation')
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(conversationId)
    
    try {
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

  return (
    <div
      className={cn(
        "bg-gray-900 text-white transition-all duration-300 flex flex-col",
        isOpen ? "w-80" : "w-0 overflow-hidden"
      )}
    >
      {/* Header with conditional content */}
      <div className="p-4 border-b border-gray-700">
        {isChatRoute ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Scale className="w-8 h-8 text-purple-400" />
              <h1 className="text-xl font-bold">HaqooqAI</h1>
            </div>
            {/* Menu toggle for chat routes */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="w-8 h-8 hover:bg-gray-800 transition-all duration-200 rounded-lg"
              title="Close sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-purple-400" />
            <Link to="/" className="text-xl font-bold hidden md:block">
              <h1 className="text-xl font-bold">HaqooqAI</h1>
            </Link>
          </div>
        )}
      </div>

      {/* User section for chat routes */}
      {isChatRoute && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-10 h-10 rounded-full ring-2 ring-purple-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <div className="mt-1">
                  <QuotaBadge />
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 hover:bg-gray-800 transition-all duration-200 rounded-lg"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl rounded-xl"
              >
                <DropdownMenuItem
                  onClick={handleSettings}
                  className="rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="font-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                    isCurrentConversation(conversation.id)
                      ? "bg-purple-600"
                      : "hover:bg-gray-800"
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatConversationDate(conversation.updated_at)}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-400 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="text-red-600"
                        disabled={deletingId === conversation.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingId === conversation.id ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer - only show for non-chat routes */}
      {!isChatRoute && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            HaqooqAI v2.0 - Pakistani Legal Assistant
          </p>
        </div>
      )}
    </div>
  )
}
