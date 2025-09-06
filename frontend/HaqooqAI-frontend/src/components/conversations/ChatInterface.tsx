import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { MessageBubbleNew } from './MessageBubbleNew'
import { MessageInputNew } from './MessageInputNew'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  conversationId?: string
  initialPrompt?: string
}

interface OutletContext {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const { createConversation } = useConversations()
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const [isNewConversation, setIsNewConversation] = useState(!conversationId)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  
  // Get sidebar controls from MainLayout context
  const context = useOutletContext<OutletContext | undefined>()
  const { sidebarOpen = false, toggleSidebar = () => {} } = context || {}

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
      {/* Main Chat Area - Full width since sidebar is handled by MainLayout */}
      <main className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-lg flex items-center justify-center"
                title="Open sidebar"
              >
                <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">menu</span>
              </button>
            )}
            {sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-lg flex items-center justify-center"
                title="Close sidebar"
              >
                <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">close</span>
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
        <div className="flex-1 overflow-y-auto p-6 scroll-container bg-[var(--background-color)] min-h-0">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={handleRetryMessage}
              />
            )}
            
            {conversationMessages.length === 0 && !fetchingLoading && (
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center space-y-8 max-w-md mx-auto px-6">
                  {/* HaqooqAI Logo with glow effect */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center mx-auto shadow-2xl">
                      <span className="material-symbols-outlined text-white text-3xl">balance</span>
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary-color)]/20 to-[var(--secondary-color)]/20 rounded-full blur-xl animate-pulse" />
                  </div>
                  
                  {/* Welcome Content */}
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                      Welcome to HaqooqAI
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)]">
                      Your intelligent Pakistani legal assistant
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] opacity-80">
                      Ask any question about Pakistani law and get instant, accurate answers with citations
                    </p>
                  </div>
                  
                  {/* Sample Topics with shimmer effect */}
                  <div className="grid grid-cols-1 gap-3 mt-8">
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition-all duration-200 cursor-pointer">
                      <p className="text-sm text-[var(--text-primary)] animate-shimmer">
                        💼 Corporate Law Questions
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition-all duration-200 cursor-pointer">
                      <p className="text-sm text-[var(--text-primary)] animate-shimmer" style={{ animationDelay: '0.5s' }}>
                        🏠 Property & Real Estate
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition-all duration-200 cursor-pointer">
                      <p className="text-sm text-[var(--text-primary)] animate-shimmer" style={{ animationDelay: '1s' }}>
                        ⚖️ Constitutional Law
                      </p>
                    </div>
                  </div>
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
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined text-base">balance</span>
                </div>
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
  )
}