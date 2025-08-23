import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip } from 'lucide-react'
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

  return (
    <div className="p-6 lg:p-8">
      <form onSubmit={handleSubmit} className={cn(
        "mx-auto transition-all duration-500 ease-in-out",
        // Dynamic max-width based on sidebar state
        sidebarOpen
          ? "max-w-5xl"
          : "max-w-6xl lg:max-w-7xl xl:max-w-none xl:px-16 2xl:px-24"
      )}>
        <div className="relative">
          {/* Character count */}
          {isNearLimit && (
            <div className="absolute -top-8 right-0 text-sm lg:text-base text-gray-500">
              {remainingChars} characters remaining
            </div>
          )}

          {/* Enhanced Input container */}
          <div className="flex items-end space-x-3 lg:space-x-4 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-2xl p-4 lg:p-5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-lg">
            {/* Attachment button (placeholder) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 w-10 h-10 lg:w-12 lg:h-12"
              disabled
              title="File attachments coming soon"
            >
              <Paperclip className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>

            {/* Enhanced Text input */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 resize-none border-0 outline-none bg-transparent min-h-[48px] lg:min-h-[56px] max-h-[140px] lg:max-h-[160px] py-3 lg:py-4 px-2 text-lg lg:text-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
              rows={1}
            />

            {/* Enhanced Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || disabled || message.length > APP_CONFIG.MAX_QUERY_LENGTH}
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-12 h-12 lg:w-14 lg:h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Send className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
          </div>

          {/* Enhanced Help text */}
          <div className="mt-3 lg:mt-4 text-sm lg:text-base text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </form>
    </div>
  )
}
