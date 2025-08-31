import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { CyclingLoader } from '@/components/ui/CyclingLoader'

interface ChatInterfaceProps {
  conversationId?: string
  initialPrompt?: string
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { createConversation } = useConversations()
  const [currentConversationId, setCurrentConversationId] = useState(conversationId)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(false)

  // Detect if sidebar should be collapsed (for chat routes, sidebar is auto-collapsed)
  const isChatRoute = location.pathname.startsWith('/chat/')
  const sidebarOpen = !isChatRoute

  const { messages, sendMessage, fetchingLoading, setupLoading, analyzingLoading } = useMessages(currentConversationId, isNewConversation)

  // Compute combined loading
  const messagesLoading = fetchingLoading || setupLoading || analyzingLoading

  // Update current conversation ID when the prop changes
  useEffect(() => {
    setCurrentConversationId(conversationId)
  }, [conversationId])

  useEffect(() => {
    if (initialPrompt && !conversationId) {
      handleInitialPrompt()
    }
  }, [initialPrompt, conversationId])

  const handleInitialPrompt = async () => {
    if (!initialPrompt) return

    try {
      setIsCreatingConversation(true)
      const conversation = await createConversation('New Conversation')
      setCurrentConversationId(conversation.id)
      setIsNewConversation(true)
      navigate(`/chat/${conversation.id}`, { replace: true })
      
      // Send the initial prompt
      setTimeout(() => {
        handleSendMessage(initialPrompt)
      }, 100)
    } catch (error) {
      console.error('Failed to create conversation for initial prompt:', error)
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    let targetConversationId = currentConversationId

    // If no conversation exists, create one
    if (!targetConversationId) {
      try {
        setIsCreatingConversation(true)
        const conversation = await createConversation('New Conversation')
        targetConversationId = conversation.id
        setCurrentConversationId(conversation.id)
        setIsNewConversation(true)
        navigate(`/chat/${conversation.id}`, { replace: true })
      } catch (error) {
        console.error('Failed to create conversation:', error)
        return
      } finally {
        setIsCreatingConversation(false)
      }
    }

    if (targetConversationId) {
      await sendMessage(targetConversationId, content)
    }
  }

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  if (isCreatingConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-8 lg:p-12">
        <div className="text-center p-12 lg:p-16 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-2xl border border-gray-200/50 dark:border-slate-700/50 max-w-2xl">
          <CyclingLoader type="setup" className="justify-center" />
          <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 mt-4">Setting up your legal consultation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Messages Area with better spacing */}
      <div className="flex-1 overflow-hidden relative">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.03)_1px,transparent_0)] [background-size:48px_48px] pointer-events-none" />

        <MessageList
          messages={conversationMessages}
          loading={messagesLoading}
          conversationId={currentConversationId}
          sidebarOpen={sidebarOpen}
          loadingType={analyzingLoading ? 'analyzing' : (setupLoading ? 'setup' : 'messages')}
        />
      </div>

      {/* Enhanced Input Area with better spacing */}
      <div className="border-t border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={messagesLoading || isCreatingConversation}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  )
}