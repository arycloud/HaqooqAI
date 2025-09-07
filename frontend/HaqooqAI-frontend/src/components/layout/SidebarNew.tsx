// src/components/layout/SidebarNew.tsx
import React from "react"
import { PlusCircle } from "lucide-react"
import { useConversations } from "@/hooks/useConversations"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarNewProps {
  activeConversationId?: string | null
  onSelectConversation: (id: string) => void
}

const SidebarNew: React.FC<SidebarNewProps> = ({
  activeConversationId,
  onSelectConversation,
}) => {
  const {
    conversations,
    loading,
    error,
    createConversation,
    refreshing,
  } = useConversations()

  return (
    <aside className="flex flex-col w-64 bg-white border-r shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => createConversation()}
        >
          <PlusCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">
            Failed to load conversations
          </div>
        )}
        {!loading && !error && conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-500">
            No conversations yet. Start a new one!
          </div>
        )}
        <ul className="space-y-1 p-2">
          {conversations.map((conv) => (
            <li key={conv.id}>
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-lg text-sm transition",
                  activeConversationId === conv.id
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <span className="truncate">
                  {conv.title || "Untitled"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Refreshing indicator */}
      {refreshing && (
        <div className="p-2 text-xs text-gray-400 text-center">
          Refreshing...
        </div>
      )}
    </aside>
  )
}

export default SidebarNew
