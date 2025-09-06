import { useState, useRef } from 'react'

interface MessageInputNewProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInputNew({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Message AI..." 
}: MessageInputNewProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="p-4 bg-[var(--sidebar-color)] border-t border-[var(--border-color)]">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg text-[var(--text-primary)] bg-[var(--input-color)] border-none h-12 placeholder:text-[var(--text-secondary)] pl-4 pr-28 py-3 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-all duration-200"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex min-w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-medium leading-normal hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">Send</span>
            <span className="material-symbols-outlined ml-1 text-base">send</span>
          </button>
        </form>
        <p className="text-[var(--text-secondary)] text-xs font-normal leading-normal pt-2 px-4 text-center">
          AI Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}