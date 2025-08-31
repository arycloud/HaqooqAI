import { useEffect, useRef } from 'react'
import { Message } from '@/types/message'
import { MessageBubble } from './MessageBubble'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Message[]
  loading: boolean
  conversationId?: string
  sidebarOpen?: boolean
  loadingType?: 'messages' | 'analyzing' | 'setup'
}

export function MessageList({ messages, loading, conversationId, sidebarOpen = true, loadingType = 'messages' }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ensure messages is always an array to prevent map errors
  const safeMessages = Array.isArray(messages) ? messages : []

  // Additional safety check for message objects
  const validMessages = safeMessages.filter(message =>
    message &&
    typeof message === 'object' &&
    message.id &&
    message.content
  )

  useEffect(() => {
    scrollToBottom()
  }, [validMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-2xl lg:max-w-3xl px-6 lg:px-8">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-xl">
            <Scale className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">Welcome to HaqooqAI</h2>
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 lg:mb-10 leading-relaxed">
            Your AI-powered Pakistani legal assistant. Ask any question about Pakistani law
            and get instant answers with comprehensive source citations.
          </p>
          <div className="text-lg lg:text-xl text-gray-500 dark:text-gray-400">
            <p>Start a conversation to begin getting professional legal assistance.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className={cn(
        "mx-auto p-6 lg:p-8 space-y-6 lg:space-y-8 transition-all duration-500 ease-in-out",
        // Dynamic max-width based on sidebar state
        sidebarOpen
          ? "max-w-5xl lg:max-w-6xl"
          : "max-w-6xl lg:max-w-7xl xl:max-w-none xl:px-16 2xl:px-24"
      )}>
        {validMessages.length === 0 && !loading ? (
          <div className="text-center py-16 lg:py-20">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-xl">
              <Scale className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">Start the conversation</h3>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Ask your first legal question to get started with HaqooqAI.
            </p>
          </div>
        ) : (
          <>
            {validMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {loading && (
              <div className="flex justify-start mb-6 lg:mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl border-2 border-gray-200 dark:border-slate-600 max-w-md">
                  <CyclingLoader type={loadingType} />
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}