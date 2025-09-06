import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { SidebarNew } from '@/components/layout/SidebarNew'
import { MessageBubbleNew } from './MessageBubbleNew'
import { MessageInputNew } from './MessageInputNew'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  conversationId?: string
  initialPrompt?: string
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const { createConversation } = useConversations()
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const [isNewConversation, setIsNewConversation] = useState(!conversationId)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    messages,
    fetchingLoading,
    setupLoading,
    analyzingLoading,
    error,
    sendMessage,
    refreshMessages,
  } = useMessages(currentConversationId, isNewConversation)

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId)
      setIsNewConversation(false)
    }
  }, [conversationId, currentConversationId])

  useEffect(() => {
    if (initialPrompt && currentConversationId) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt, currentConversationId])

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

  const handleRetryMessage = () => {
    if (refreshMessages) {
      refreshMessages()
    }
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[var(--background-color)] group/design-root overflow-x-hidden">
      <div className="flex h-full grow">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="relative z-30"
            >
              <SidebarNew isOpen={true} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-8 h-8 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-lg flex items-center justify-center"
                  title="Open sidebar"
                >
                  <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">menu</span>
                </button>
              )}
              <h2 className="text-[var(--text-primary)] text-xl font-bold leading-tight">
                HaqooqAI Legal Assistant
              </h2>
            </div>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-8 px-4 bg-[var(--hover-color)] text-[var(--text-primary)] text-sm font-medium leading-normal hover:bg-opacity-80">
              <span className="material-symbols-outlined text-base">share</span>
              <span className="truncate">Share</span>
            </button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 scroll-container bg-[var(--background-color)]">
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
              {error && (
                <ErrorDisplay 
                  error={error} 
                  onRetry={handleRetryMessage}
                />
              )}
              
              {conversationMessages.length === 0 && !fetchingLoading && (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <h3 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                      Ask me anything about Pakistani law
                    </p>
                  </div>
                </div>
              )}

              {conversationMessages.map((message) => (
                <MessageBubbleNew
                  key={message.id}
                  message={message}
                  isLoading={false}
                />
              ))}

              {fetchingLoading && (
                <div className="flex items-start gap-4">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
                    style={{
                      backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVhzVdaXxR_p3E3fMgkBz6ftAWMIQhZhO0eUcPg45HQcdqABNiD5l6e6QsmtMvjc9BB0OvnBD2tGF3S-xwL9gIbPYll5USP6s23Kp2ACsN2pS8-BL7xZuTvsl5GBDScDTeMDzmxcLqQHziqI-MLkoUT2iRVJlLOMarIe7usrFfE8Oajmt1IlKu5v4ugihjYpj3CPmESsk0vDWPxGgE5iZTajLFJF2ShkkHueRk2B1iNOrj3fEjiDXuT7ntwpGvAgSaQ5GOyihkuWw")`
                    }}
                  />
                  <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-xl flex-1">
                    <p className="text-purple-300 text-sm font-bold leading-tight mb-2">HaqooqAI</p>
                    <CyclingLoader />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <MessageInputNew
            onSendMessage={handleSendMessage}
            disabled={fetchingLoading || isCreatingConversation}
          />
        </main>
      </div>
    </div>
  )
}