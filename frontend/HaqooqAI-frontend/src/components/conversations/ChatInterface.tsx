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
import { Header } from '@/components/layout/Header'

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
    if (setupLoading || isCreatingConversation) return 'setup'
    if (fetchingLoading) return 'messages'
    return 'general'
  }, [analyzingLoading, setupLoading, fetchingLoading, isCreatingConversation])

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  useEffect(() => { scrollToBottom('auto') }, [currentConversationId])
  useEffect(() => { scrollToBottom() }, [conversationMessages.length, fetchingLoading, setupLoading, analyzingLoading])

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

  const handleRetryMessage = () => { if (refreshMessages) refreshMessages() }

  const showCenteredLoader =
    conversationMessages.length === 0 &&
    (fetchingLoading || setupLoading || isCreatingConversation)

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background-color)]">
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

      {/* Main content with sidebar shift */}
      <div
        className={cn(
          "flex flex-col flex-1 h-full transition-all duration-500 ease-in-out",
          sidebarOpen ? "lg:ml-80" : ""
        )}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-20">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
        </header>

        {/* Messages Area */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-6 bg-[var(--background-color)]">
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {error && <ErrorDisplay error={error} onRetry={handleRetryMessage} />}

            {/* Centered Loader when opening/loading a conversation */}
            {showCenteredLoader && (
              <div className="flex flex-col items-center justify-center flex-1 py-20 space-y-8">
                {/* Big Logo */}
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
                  <img src="/logo.svg" alt="HaqooqAI Logo" className="w-16 h-16" />
                </div>

                {/* Loader */}
                <CyclingLoader type={loaderType} />

                {/* Shimmer Messages */}
                <div className="w-full max-w-md space-y-4 mt-6">
                  {loaderType === 'setup' && (
                    <>
                      <div className="h-4 w-3/4 bg-[var(--hover-color)]/40 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-[var(--hover-color)]/30 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-[var(--hover-color)]/20 rounded animate-pulse" />
                    </>
                  )}

                  {loaderType === 'messages' && (
                    <>
                      <div className="h-4 w-full bg-[var(--hover-color)]/40 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-[var(--hover-color)]/30 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-[var(--hover-color)]/20 rounded animate-pulse" />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Empty state cards */}
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
                    {/* Example cards */}
                    <div
                      className="p-4 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-xl border hairline hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() =>
                        handleSendMessage(
                          "What are the legal requirements for property purchase in Pakistan?"
                        )
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-purple-400 mt-0.5">
                          home
                        </span>
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
                      className="p-4 bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-xl border hairline hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() =>
                        handleSendMessage(
                          "How do I register a marriage in Pakistan?"
                        )
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-pink-400 mt-0.5">
                          favorite
                        </span>
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
                      className="p-4 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 rounded-xl border hairline hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() =>
                        handleSendMessage(
                          "What documents are needed to start a business in Pakistan?"
                        )
                      }
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 mt-0.5">
                          business
                        </span>
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

            {/* Messages */}
            {conversationMessages.length > 0 &&
              conversationMessages.map((message) => (
                <MessageBubbleNew
                  key={message.id}
                  message={message}
                  isLoading={false}
                />
              ))}

            {/* Analyzing loader (as message bubble, after sending) */}
            {analyzingLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8">
              {/* Big Logo */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
                <img src="/logo.svg" alt="HaqooqAI Logo" className="w-12 h-12" />
              </div>

              {/* Loader */}
              <CyclingLoader type="analyzing" />

              {/* Shimmer text effect */}
              <div className="w-full max-w-md space-y-4 mt-6">
                <div className="h-4 w-3/4 bg-[var(--hover-color)]/40 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-[var(--hover-color)]/30 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-[var(--hover-color)]/20 rounded animate-pulse" />
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-[var(--background-color)] border-t border-[var(--border-color)] p-3">
          <MessageInputNew
            onSendMessage={handleSendMessage}
            disabled={
              fetchingLoading ||
              isCreatingConversation ||
              setupLoading ||
              analyzingLoading
            }
            placeholder="Ask a sample legal question..."
          />
        </div>
      </div>
    </div>
  )

}
