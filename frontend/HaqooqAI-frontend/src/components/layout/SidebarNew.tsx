import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { Conversation } from '@/types/conversation'
import { Home, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Sidebar() {
  const { user } = useAuth()
  const { conversations, isLoading } = useConversations(user)

  return (
    <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
          Chats
        </h2>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" title="Dashboard">
            <Home className="w-5 h-5 text-gray-500 hover:text-primary transition-colors" />
          </Link>
          <Link to="/settings" title="Settings">
            <Settings className="w-5 h-5 text-gray-500 hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-gray-400">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-gray-400">No conversations yet</div>
        ) : (
          conversations.map((conv: Conversation) => (
            <div
              key={conv.id}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {conv.title || 'Untitled'}
              </p>
              <p className="text-xs text-gray-500">
                {conv.updated_at
                  ? new Date(conv.updated_at).toLocaleString()
                  : 'No activity'}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
