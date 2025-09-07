import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarNew from '@/components/layout/SidebarNew'
import { MessageBubbleNew } from '@/components/conversations/MessageBubbleNew'
import { MessageInputNew } from '@/components/conversations/MessageInputNew'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
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

  const loaderType = useMemo(() => {
    if (analyzingLoading) return 'analyzing'
    if (setupLoading) return 'setup'
    if (fetchingLoading) return 'messages'
    return 'general'
  }, [analyzingLoading, setupLoading, fetchingLoading])

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

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
      } catch (err) {
        console.error('Failed to create conversation:', err)
        return
      } finally {
        setIsCreatingConversation(false)
      }
    }

    if (targetConversationId) {
      await sendMessage(targetConversationId, content)
      requestAnimationFrame(() => scrollToBottom())
    }
  }

  const handleRetryMessage = () => {
    if (refreshMessages) refreshMessages()
  }

  const showConversationLoader =
    conversationMessages.length === 0 &&
    (fetchingLoading || setupLoading || analyzingLoading || isCreatingConversation)

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background-color)] group/design-root">
      {/* Sidebar overlay (mobile) */}
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

      {/* Main area */}
      <div
        className={cn(
          "flex flex-col flex-1 h-full transition-all duration-500 ease-in-out overflow-hidden",
          sidebarOpen ? "lg:ml-80" : ""
        )}
      >
        {/* Navbar */}
        <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0 bg-[var(--sidebar-color)]/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 hover:bg-[var(--hover-color)] rounded-lg flex items-center justify-center"
                title="Open sidebar"
              >
                <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">menu</span>
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 hover:bg-[var(--hover-color)] rounded-lg flex items-center justify-center"
                title="Close sidebar"
              >
                <span className="material-symbols-outlined text-[var(--text-primary)] text-xl">close</span>
              </button>
            )}
            <h2 className="text-[var(--text-primary)] text-xl font-bold leading-tight">HaqooqAI Legal Assistant</h2>
          </div>

          <button className="flex min-w-[84px] items-center justify-center gap-2 rounded-lg h-8 px-4 bg-[var(--hover-color)] text-[var(--text-primary)] text-sm font-medium hover:bg-opacity-80">
            <span className="material-symbols-outlined text-base">share</span>
            <span className="truncate">Share</span>
          </button>
        </header>

        {/* Messages area */}
        <div className="flex flex-col flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            className="flex flex-col flex-1 overflow-y-auto p-6 bg-[var(--background-color)]"
          >
            <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
              {error && <ErrorDisplay error={error} onRetry={handleRetryMessage} />}

              {showConversationLoader && (
                <div className="flex items-center gap-4">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined text-base">balance</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-xl flex-1">
                    <p className="text-purple-300 text-sm font-bold leading-tight mb-2">HaqooqAI</p>
                    <CyclingLoader type={loaderType} />
                  </div>
                </div>
              )}

              {/* Welcome cards */}
              {conversationMessages.length === 0 &&
                !fetchingLoading &&
                !setupLoading &&
                !analyzingLoading &&
                !isCreatingConversation && (
                  <div className="pt-8">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                        Try asking about:
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Click on any question to get started
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div
                        className="p-4 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() =>
                          handleSendMessage("What are the legal requirements for property purchase in Pakistan?")
                        }
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-purple-400 mt-0.5">home</span>
                          <div className="text-left">
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                              Property Purchase
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              Legal documents and procedures for buying property
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-4 bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() =>
                          handleSendMessage("How do I register a marriage in Pakistan?")
                        }
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-pink-400 mt-0.5">favorite</span>
                          <div className="text-left">
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                              Marriage Registration
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              Required documents and process for marriage
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-4 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() =>
                          handleSendMessage("What documents are needed to start a business in Pakistan?")
                        }
                      >
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-blue-400 mt-0.5">business</span>
                          <div className="text-left">
                            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                              Business Registration
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              Steps and documents required to register a business
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {conversationMessages.length > 0 &&
                conversationMessages.map((message) => (
                  <MessageBubbleNew key={message.id} message={message} isLoading={false} />
                ))}
                {analyzingLoading && (
                <div className="flex items-start gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">hourglass_top</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--hover-color)] text-sm text-[var(--text-secondary)] italic">
                    Analyzing your query...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 w-full">
          <MessageInputNew
            onSendMessage={handleSendMessage}
            disabled={fetchingLoading || isCreatingConversation || setupLoading || analyzingLoading}
            placeholder="Ask a sample legal question..."
          />
        </div>
      </div>
    </div>
  )
}
