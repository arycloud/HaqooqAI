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

  // Small presentational logo + spinner element (matches design)
  const LogoCircle = ({ size = 96 }: { size?: number }) => {
    // Using CSS structure to mimic the circular spinner and colored arc
    const px = size
    return (
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: px, height: px }}
        aria-hidden
      >
        {/* Outer ring */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: px,
            height: px,
            border: '5px solid rgba(255,255,255,0.07)',
            boxSizing: 'border-box',
          }}
        />
        {/* Colored arc (top-right) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '9999px',
            background: 'conic-gradient(#ff6b6b 0deg, #ff6b6b 60deg, transparent 60deg 360deg)',
            maskImage: 'linear-gradient(#000, #000)', // ensure full arc visible
            transform: 'rotate(20deg)',
            opacity: 1,
          }}
        />
        {/* Inner hollow */}
        <div
          className="rounded-full bg-[var(--background-color)]"
          style={{
            width: px - 18,
            height: px - 18,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          }}
        />
      </div>
    )
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
          className="flex flex-col flex-1 overflow-y-auto p-6 bg-[var(--background-color)]"
          style={{
            // give extra bottom padding so sticky input doesn't overlap last messages
            paddingBottom: '140px',
          }}
        >
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {error && <ErrorDisplay error={error} onRetry={handleRetryMessage} />}

            {/* CENTERED LOADER for initial conversation load (no message bubbles) */}
            {showCenteredLoader && <CyclingLoader type={loaderType} />}

            {/* When no messages (and not loading) show the empty prompt cards */}
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
                      onClick={() => handleSendMessage("What are the legal requirements for property purchase in Pakistan?")}
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-purple-400 mt-0.5">home</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm">Property Purchase</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Legal documents and procedures for buying property</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() => handleSendMessage("How do I register a marriage in Pakistan?")}
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-pink-400 mt-0.5">favorite</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm">Marriage Registration</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Required documents and process for marriage</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-color)]/50 transition cursor-pointer shadow-sm hover:shadow-md"
                      onClick={() => handleSendMessage("What documents are needed to start a business in Pakistan?")}
                    >
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-blue-400 mt-0.5">business</span>
                        <div className="text-left">
                          <h4 className="font-semibold text-[var(--text-primary)] text-sm">Business Registration</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">Steps and documents required to register a business</p>
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
              <div className="flex flex-col items-center justify-center w-full mt-6">
                <div className="mb-4">
                  <LogoCircle size={64} />
                </div>

                <div className="w-full max-w-md bg-[var(--input-color)]/0 p-0 rounded-md">
                  <CyclingLoader type="analyzing" />
                </div>

                {/* Shimmer placeholders under the loader */}
                <div className="w-full max-w-md mt-4 space-y-2">
                  <div className="h-3 w-3/4 bg-[var(--hover-color)]/30 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-[var(--hover-color)]/20 rounded animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sticky input at bottom (always visible) */}
        <div className="sticky bottom-0 z-40 bg-[var(--background-color)] border-t border-[var(--border-color)] p-3 backdrop-blur-sm">
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
