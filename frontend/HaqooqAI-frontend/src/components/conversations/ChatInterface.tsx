import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Scale } from 'lucide-react'
// import { MainLayout } from '@/components/layout/MainLayout'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'

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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10">
      {/* Modern Header with Glass Effect */}
      <div className="flex-shrink-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Legal Assistant</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Powered by HaqooqAI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(analyzingLoading || isCreatingConversation) && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Processing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Enhanced with modern styling */}
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.08)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />
        
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
            />
          </div>
        )}
      </div>

      {/* Enhanced Message Input with modern glass effect */}
      <div className="flex-shrink-0 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-t border-gray-200/50 dark:border-gray-700/50">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={analyzingLoading || isCreatingConversation || setupLoading}
          placeholder="Ask about Pakistani law..."
        />
      </div>
    </div>
  )
}