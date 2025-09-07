import { useState, useRef } from 'react'

interface MessageInputNewProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInputNew({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Ask a sample legal question..." 
}: MessageInputNewProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
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
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px'
    }
  }

  return (
    <div className="sticky bottom-0 p-3 bg-[var(--sidebar-color)] border-t border-[var(--border-color)]">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="w-full resize-none rounded-xl text-[var(--text-primary)] bg-[var(--input-color)] border-none min-h-[60px] placeholder:text-[var(--text-secondary)] pl-5 pr-32 py-4 focus:ring-2 focus:ring-[var(--primary-color)] focus:outline-none transition-all duration-200"
            style={{ minHeight: '60px', maxHeight: '150px' }}
          />
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex min-w-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-[var(--text-primary)] text-sm font-medium leading-normal hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="truncate">Send</span>
            <span className="material-symbols-outlined ml-2 text-base">send</span>
          </button>
        </form>
        <p className="text-[var(--text-secondary)] text-xs font-normal leading-normal pt-2 px-2 text-center">
          AI Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}
