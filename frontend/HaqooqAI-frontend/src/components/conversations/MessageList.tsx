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
      <div className="h-full flex items-center justify-center relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
        
        <div className="text-center max-w-3xl px-8 relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl">
              <Scale className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-2xl" />
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HaqooqAI</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Your intelligent Pakistani legal assistant powered by advanced AI
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Legal Research</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get instant answers with verified legal sources</p>
            </div>
            
            <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl">⚖️</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Case Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Analyze legal cases and precedents</p>
            </div>
            
            <div className="group p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Document Help</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assistance with legal documentation</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.05)_1px,transparent_0)] [background-size:32px_32px]" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {validMessages.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl">
                <Scale className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-xl" />
            </div>
            
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Let's start the conversation
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
              Ask your first legal question to get started with HaqooqAI.
            </p>
            
            {/* Suggested questions */}
            <div className="mt-8 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Try asking:</p>
              <div className="space-y-2">
                <div className="inline-block bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
                  "What are the property rights in Pakistan?"
                </div>
                <br />
                <div className="inline-block bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
                  "How to register a business in Pakistan?"
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {validMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  {/* Modern loading bubble */}
                  <div className="flex items-start space-x-4">
                    <div className="relative flex-shrink-0 group">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          HaqooqAI
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Just now
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 mr-8">
                    <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                      <CyclingLoader type={loadingType} />
                      
                      {/* Animated dots */}
                      <div className="absolute bottom-4 right-6 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      
                      {/* Speech bubble tail */}
                      <div className="absolute top-6 left-[-8px] w-4 h-4 bg-white/80 dark:bg-gray-800/80 border-l border-t border-gray-200/50 dark:border-gray-700/50 transform rotate-45 backdrop-blur-sm" />
                    </div>
                  </div>
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