import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
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
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
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

            {/* Enhanced input container with premium design */}
            <div className={`relative group transition-all duration-300 ${
              isFocused 
                ? 'transform scale-[1.01]' 
                : 'hover:transform hover:scale-[1.005]'
            }`}>
              <div className={`relative backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-3xl border-2 transition-all duration-300 shadow-xl ${
                isFocused
                  ? 'border-blue-500 dark:border-blue-400 shadow-2xl shadow-blue-500/25'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 group-hover:shadow-2xl'
              }`}>
                
                {/* Input area with better spacing */}
                <div className="flex items-end space-x-4 p-6">
                  {/* Text input area - wider and more prominent */}
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
                      className="w-full resize-none border-0 outline-none bg-transparent min-h-[64px] max-h-[200px] py-4 px-6 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium leading-relaxed rounded-2xl transition-all duration-200"
                      rows={1}
                    />
                    
                    {/* Enhanced placeholder when focused and empty */}
                    {!hasContent && isFocused && (
                      <div className="absolute top-4 left-6 pointer-events-none">
                        <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          <span className="text-lg font-medium">Ask anything about Pakistani law...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced send button - more prominent */}
                  <div className="flex-shrink-0">
                    <Button
                      type="submit"
                      disabled={!hasContent || disabled || message.length > APP_CONFIG.MAX_QUERY_LENGTH}
                      className={`w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 transform font-medium ${
                        hasContent && !disabled
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110 shadow-2xl hover:shadow-blue-500/50 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-lg'
                      }`}
                    >
                      {disabled ? (
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className={`w-6 h-6 transition-all duration-300 ${
                          hasContent ? 'text-white transform rotate-0' : 'transform -rotate-45'
                        }`} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Enhanced bottom bar with better design */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-6">
                      <span className="flex items-center space-x-2">
                        <kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs font-medium">↵</kbd>
                        <span>Send message</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <kbd className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs font-medium">⇧↵</kbd>
                        <span>New line</span>
                      </span>
                    </div>
                    
                    {hasContent && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-medium">Ready to send</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced glow effect when focused */}
                {isFocused && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-25 blur-lg transition-opacity duration-300" />
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
