import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageBubbleNew } from './MessageBubbleNew'
import { MessageInputNew } from './MessageInputNew'
import { CyclingLoader, LoaderType } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { SidebarNew } from '@/components/layout/SidebarNew'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    fetchingLoading,
    setupLoading,
    analyzingLoading,
    error,
    sendMessage,
    refreshMessages,
  } = useMessages(currentConversationId, isNewConversation)

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  // pick correct loader type
  const loaderType: LoaderType | undefined = useMemo(() => {
    if (analyzingLoading) return 'analyzing'
    if (setupLoading) return 'setup'
    if (fetchingLoading) return 'messages'
    return undefined
  }, [analyzingLoading, setupLoading, fetchingLoading])

  // Scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    scrollToBottom('auto')
  }, [currentConversationId])

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages.length, fetchingLoading, setupLoading, analyzingLoading])

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
      // scroll a tick later to ensure new “user” message rendered
      requestAnimationFrame(() => scrollToBottom())
    }
  }

  const handleRetryMessage = () => {
    if (refreshMessages) refreshMessages()
  }

  return (
    <div className="flex h-screen bg-[var(--background-color)] group/design-root overflow-hidden">
      {/* Sidebar with overlay (mobile) */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-40">
            <SidebarNew isOpen={true} />
          </div>
        </>
      )}

      {/* Main column */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 transition-all duration-500 ease-in-out",
          sidebarOpen ? "lg:ml-80" : ""
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-9 h-9 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-lg flex items-center justify-center"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">
                {sidebarOpen ? 'close' : 'menu'}
              </span>
            </button>
            <h2 className="text-[var(--text-primary)] text-lg sm:text-xl font-bold leading-tight">
              HaqooqAI Legal Assistant
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-8 px-4 bg-[var(--hover-color)] text-[var(--text-primary)] text-sm font-medium leading-normal hover:bg-opacity-80">
              <span className="material-symbols-outlined text-base">share</span>
              <span className="truncate">Share</span>
            </button>
          </div>
        </header>

        {/* Messages + Composer */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Scroll area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-[var(--background-color)]"
          >
            <div className="mx-auto w-full max-w-3xl sm:max-w-4xl">
              {error && <ErrorDisplay error={error} onRetry={handleRetryMessage} />}

              {/* Empty welcome */}
              {conversationMessages.length === 0 && !fetchingLoading && !setupLoading && !analyzingLoading && (
                <div className="pt-16 sm:pt-20">
                  <div className="text-center space-y-8 max-w-md mx-auto px-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center mx-auto shadow-2xl">
                        <span className="material-symbols-outlined text-white text-3xl">balance</span>
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary-color)]/20 to-[var(--secondary-color)]/20 rounded-full blur-xl animate-pulse" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to HaqooqAI</h2>
                      <p className="text-[var(--text-secondary)]">Your intelligent Pakistani legal assistant</p>
                    </div>
                  </div>

                  <div className="mt-10">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Try asking about:</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Click on any question to get started</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        ["What are the legal requirements for property purchase in Pakistan?", "home", "Property Purchase", "Legal documents and procedures for buying property in Pakistan"],
                        ["How do I register a marriage in Pakistan?", "favorite", "Marriage Registration", "Required documents and process for marriage registration"],
                        ["What documents are needed to start a business in Pakistan?", "business", "Business Registration", "Steps and documents required to register a business"],
                      ].map(([q, icon, title, subtitle]) => (
                        <button
                          key={title}
                          onClick={() => handleSendMessage(String(q))}
                          className="text-left p-4 bg-[var(--hover-color)]/70 hover:bg-[var(--hover-color)] backdrop-blur-sm rounded-xl border border-[var(--border-color)] transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                        >
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[var(--primary-color)] mt-0.5">{icon}</span>
                            <div>
                              <h4 className="font-semibold text-[var(--text-primary)] text-sm">{title}</h4>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex flex-col gap-5">
                {conversationMessages.length > 0 && conversationMessages.map((message) => (
                  <MessageBubbleNew
                    key={message.id}
                    message={message}
                    isLoading={false}
                  />
                ))}

                {/* Streaming / loading indicator (assistant “thinking”) */}
                {(fetchingLoading || setupLoading || analyzingLoading) && (
                  <div className="flex items-start gap-3">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined text-sm">balance</span>
                    </div>
                    <div className="bg-[var(--hover-color)]/60 p-4 rounded-xl flex-1 border border-[var(--border-color)]">
                      <p className="text-purple-300 text-xs font-bold leading-tight mb-1.5">HaqooqAI</p>
                      <CyclingLoader type={loaderType ?? 'general'} />
                    </div>
                  </div>
                )}
              </div>

              {/* Spacer for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer (sticky bottom) */}
          <div className="flex-shrink-0 w-full border-t border-[var(--border-color)] bg-[var(--sidebar-color)] pb-[env(safe-area-inset-bottom)]">
            <MessageInputNew
              onSendMessage={handleSendMessage}
              disabled={fetchingLoading || isCreatingConversation || setupLoading || analyzingLoading}
              placeholder="Ask a sample legal question..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
