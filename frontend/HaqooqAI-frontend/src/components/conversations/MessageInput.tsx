import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/utils/constants'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  sidebarOpen?: boolean
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Ask a legal question...",
  sidebarOpen = true
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled) return
    
    if (message.length > APP_CONFIG.MAX_QUERY_LENGTH) {
      alert(`Message is too long. Maximum length is ${APP_CONFIG.MAX_QUERY_LENGTH} characters.`)
      return
    }

    onSendMessage(message.trim())
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const remainingChars = APP_CONFIG.MAX_QUERY_LENGTH - message.length
  const isNearLimit = remainingChars < 100
  const hasContent = message.trim().length > 0

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent dark:from-gray-900/50 pointer-events-none" />
      
      <div className="relative z-10 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Character count indicator */}
            {isNearLimit && (
              <div className="absolute -top-8 right-0 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  remainingChars < 50 ? 'bg-red-500' : remainingChars < 100 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span>{remainingChars} characters remaining</span>
              </div>
            )}

            {/* Main input container with glass morphism */}
            <div className={`relative group transition-all duration-300 ${
              isFocused 
                ? 'transform scale-[1.02]' 
                : 'hover:transform hover:scale-[1.01]'
            }`}>
              <div className={`relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl border-2 transition-all duration-300 shadow-lg ${
                isFocused
                  ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group-hover:shadow-xl'
              }`}>
                
                {/* Input area */}
                <div className="flex items-end space-x-4 p-4">
                  {/* Left action buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      disabled
                      title="Attach files (coming soon)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-xl text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                      disabled
                      title="Voice input (coming soon)"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Text input area */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      disabled={disabled}
                      className="w-full resize-none border-0 outline-none bg-transparent min-h-[60px] max-h-[200px] py-4 px-4 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium leading-relaxed"
                      rows={1}
                    />
                    
                    {/* Placeholder enhancement when focused */}
                    {!hasContent && isFocused && (
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-lg font-medium">Ask anything about Pakistani law...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send button */}
                  <div className="flex-shrink-0">
                    <Button
                      type="submit"
                      disabled={!hasContent || disabled || message.length > APP_CONFIG.MAX_QUERY_LENGTH}
                      className={`w-12 h-12 rounded-2xl shadow-lg transition-all duration-300 transform ${
                        hasContent && !disabled
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110 shadow-xl hover:shadow-2xl shadow-blue-500/25'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {disabled ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className={`w-5 h-5 transition-all duration-300 ${
                          hasContent ? 'text-white transform rotate-0' : 'transform -rotate-45'
                        }`} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Bottom bar with shortcuts and suggestions */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">↵</span>
                        <span>Send</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">⇧↵</span>
                        <span>New line</span>
                      </span>
                    </div>
                    
                    {hasContent && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Ready to send</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Glow effect when focused */}
                {isFocused && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-20 blur transition-opacity duration-300" />
                )}
              </div>
              
              {/* Quick action suggestions (when empty) */}
              {!hasContent && !isFocused && (
                <div className="absolute -top-16 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Try: "What are property rights in Pakistan?"</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
