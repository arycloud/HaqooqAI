import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarNew from '@/components/layout/SidebarNew'
import { MessageBubbleNew } from '@/components/conversations/MessageBubbleNew'
import { MessageInputNew } from '@/components/conversations/MessageInputNew'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { AnalyzingLoader } from '../ui/AnalyzingLoader'

interface ChatInterfaceProps {
  conversationId?: string
  initialPrompt?: string
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const { createConversation } = useConversations()

  // Local UI state
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const [isNewConversation, setIsNewConversation] = useState(!conversationId)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Messages hook
  const {
    messages,
    fetchingLoading,
    setupLoading,
    analyzingLoading,
    error,
    sendMessage,
    refreshMessages,
  } = useMessages(currentConversationId, isNewConversation)

  // Determine loader type (passed to CyclingLoader)
  const loaderType = useMemo(() => {
  if (analyzingLoading) return 'analyzing'
  if (setupLoading || isCreatingConversation) return 'setup'
  if (fetchingLoading) return 'messages'
  return 'general'
}, [analyzingLoading, setupLoading, fetchingLoading, isCreatingConversation])

  // Current conversation messages array
  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  // Scroll helpers
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
  }

  useEffect(() => {
    // When conversation changes, jump to bottom
    scrollToBottom('auto')
  }, [currentConversationId])

  useEffect(() => {
    // Keep view scrolled to bottom when messages change
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, currentConversationId])

  // Create conversation (used when sending first message without convId)
  const handleSendMessage = async (content: string) => {
    let targetConversationId = currentConversationId

    if (!targetConversationId) {
      try {
        // Start local creation state immediately so UI can show "setup" loader
        setIsCreatingConversation(true)
        const conversation = await createConversation('New Conversation')
        targetConversationId = conversation.id
        setCurrentConversationId(conversation.id)
        setIsNewConversation(true)
        // navigate to new chat route
        navigate(`/chat/${conversation.id}`, { replace: true })
      } catch (err) {
        console.error('Failed to create conversation:', err)
        return
      } finally {
        // keep showing setup loader while messages are loaded by useMessages hook;
        // but remove the local creation flag here to allow loaderType to rely on setupLoading
        setIsCreatingConversation(false)
      }
    }

    if (targetConversationId) {
      await sendMessage(targetConversationId, content)
      requestAnimationFrame(() => scrollToBottom())
    }
  }

  // Retry handler for errors
  const handleRetryMessage = () => {
    if (refreshMessages) refreshMessages()
  }

  // Show centered loader only when there are NO messages and we're loading (initial open)
  const showCenteredLoader =
    conversationMessages.length === 0 &&
    (fetchingLoading || setupLoading || isCreatingConversation)

  // Show analyzing overlay when there are messages and AI is processing a submitted query
  // We want to show an analyzing loader (non-bubble) below messages (not full-screen)
  const showAnalyzingOverlay = analyzingLoading && !showCenteredLoader

  // New: Hero illustration for empty state (simple icon-based)
  const HeroIllustration = () => (
    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center text-[var(--primary-color)]" aria-hidden>
      <span className="material-symbols-outlined text-6xl">balance</span>
    </div>
  )

  // Handle prompt click with keyboard support
  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt)
  }

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

      {/* Main content - header is outside scroll area so it stays sticky */}
      <div className={cn("flex flex-col flex-1 h-full transition-all duration-500 ease-in-out", sidebarOpen ? "lg:ml-80" : "")}>
        {/* Header (sticky) */}
        <header className="sticky top-0 z-30">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        </header>

        {/* Messages container (scrollable) */}
        <div
          ref={scrollContainerRef}
          className="flex flex-col flex-1 overflow-y-auto px-4 sm:px-6 bg-[var(--background-color)]"
          style={{
            // give extra bottom padding so sticky input doesn't overlap last messages
            paddingBottom: '100px',
          }}
        >
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full py-8">
            {error && <ErrorDisplay error={error} onRetry={handleRetryMessage} />}

            {/* CENTERED LOADER for initial conversation load (no message bubbles) */}
            {showCenteredLoader && (
              <div className="flex flex-col items-center justify-center py-12" aria-label="Loading conversation">
                <div className="w-12 h-12 border-4 border-[var(--primary-color)]/20 border-t-[var(--primary-color)] rounded-full animate-spin mb-4"></div>
                <p className="text-[var(--text-secondary)]">Setting up conversation...</p>
              </div>
            )}

            {/* When no messages (and not loading) show the empty prompt cards */}
            {conversationMessages.length === 0 &&
              !fetchingLoading &&
              !setupLoading &&
              !analyzingLoading &&
              !isCreatingConversation && (
                <div className="text-center py-12">
                  <HeroIllustration />
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-inter">
                    Welcome to HaqooqAI
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-8 font-inter">
                    Your legal assistant for Pakistan. Try asking about:
                  </p>
                  <div className="space-y-3 max-w-md mx-auto">
                    <div
                      className="prompt-card p-4 cursor-pointer transition-all duration-200"
                      onClick={() => handlePromptClick("What are the legal requirements for property purchase in Pakistan?")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handlePromptClick("What are the legal requirements for property purchase in Pakistan?")
                        }
                      }}
                      aria-label="Ask about property purchase"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[var(--primary-color)] mt-0.5">home</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm font-inter">Property Purchase</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">Legal documents and procedures for buying property</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="prompt-card p-4 cursor-pointer transition-all duration-200"
                      onClick={() => handlePromptClick("How do I register a marriage in Pakistan?")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handlePromptClick("How do I register a marriage in Pakistan?")
                        }
                      }}
                      aria-label="Ask about marriage registration"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-pink-400 mt-0.5">favorite</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm font-inter">Marriage Registration</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">Required documents and process for marriage</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="prompt-card p-4 cursor-pointer transition-all duration-200"
                      onClick={() => handlePromptClick("What documents are needed to start a business in Pakistan?")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handlePromptClick("What documents are needed to start a business in Pakistan?")
                        }
                      }}
                      aria-label="Ask about business registration"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[var(--secondary-color)] mt-0.5">business</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm font-inter">Business Registration</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">Steps and documents required to register a business</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Render existing messages as message bubbles (when any) */}
            {conversationMessages.length > 0 && conversationMessages.map((message) => (
              <MessageBubbleNew key={message.id} message={message} isLoading={false} />
            ))}

            {/* ANALYZING overlay (non-bubble): show while waiting for AI response after user submits */}
            {showAnalyzingOverlay && (
              <div className="flex justify-start mt-4">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-inter" aria-label="AI is analyzing">
                  <div className="w-5 h-5 border-2 border-[var(--primary-color)]/20 border-t-[var(--primary-color)] rounded-full animate-spin"></div>
                  <span>AI is preparing response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sticky input at bottom (always visible) */}
        <div className="sticky bottom-0 z-40 bg-[var(--background-color)] border-t border-[var(--border-color)]">
          <div className="max-w-4xl mx-auto">
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

// export default ChatInterface