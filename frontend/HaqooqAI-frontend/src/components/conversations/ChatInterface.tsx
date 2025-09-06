import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Scale, Menu, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarNew } from '@/components/layout/SidebarNew'
import { MessageList } from './MessageList'
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="w-8 h-8 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-lg"
                  title="Open sidebar"
                >
                  <Menu className="w-5 h-5 text-[var(--text-primary)]" />
                </Button>
              )}
              <h2 className="text-[var(--text-primary)] text-xl font-bold leading-tight">
                HaqooqAI Legal Assistant
              </h2>
            </div>
            <Button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-8 px-4 bg-[var(--hover-color)] text-[var(--text-primary)] text-sm font-medium leading-normal hover:bg-opacity-80">
              <Share className="w-4 h-4" />
              <span className="truncate">Share</span>
            </Button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 scroll-container bg-[var(--background-color)]">
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        
        {setupLoading ? (
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl">
                <Scale className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Setting up your session</h3>
                <CyclingLoader type="setup" />
              </div>
            </div>
          </div>
        ) : fetchingLoading ? (
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl">
                <Scale className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Loading conversation</h3>
                <CyclingLoader type="fetching" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full relative z-10">
            <div className="max-w-md mx-auto p-6">
              <ErrorDisplay 
                error={error} 
                onRetry={handleRetryMessage}
                showSettingsButton={true}
              />
            </div>
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 relative z-10">
            <div className="text-center space-y-8 max-w-md mx-auto px-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl">
                  <Scale className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-xl" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to HaqooqAI</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">Your intelligent Pakistani legal assistant</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ask any question about Pakistani law and get instant, accurate answers with citations</p>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-8">
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">💼 Corporate Law Questions</p>
                </div>
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">🏠 Property & Real Estate</p>
                </div>
                <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">⚖️ Constitutional Law</p>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="relative z-10">
              <MessageList
                messages={conversationMessages}
                loading={analyzingLoading}
                conversationId={currentConversationId}
                loadingType="analyzing"
                sidebarOpen={sidebarOpen}
                onSampleQuery={handleSendMessage}
              />
            </div>
          )}
        </div>

        {/* Enhanced Message Input with modern glass effect */}
        <div className="flex-shrink-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-t border-gray-200/50 dark:border-gray-700/50">
          <MessageInputNew
            onSendMessage={handleSendMessage}
            disabled={analyzingLoading || isCreatingConversation || setupLoading}
            sidebarOpen={sidebarOpen}
            placeholder="Message HaqooqAI..."
          />
        </div>
      </div>

      {/* Overlay for sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}