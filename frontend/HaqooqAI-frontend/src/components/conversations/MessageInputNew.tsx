// Changes: Rounded input (20px), icon-only send button, character counter, ARIA enhancements.
// Auto-grow limited to 120px. New classes for light/neutral theme.
import { useState, useRef, useEffect } from 'react'

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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer:fine)').matches) {
      textareaRef.current?.focus()
    }
  }, [])

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault()
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSendMessage(trimmed)
      setMessage('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px'  // Reduced max height for minimalism
    }
  }

  return (
    <div className="p-4 bg-[var(--background-color)] border-t border-[var(--border-color)]">  {/* Increased padding, neutral bg */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative" aria-label="Message input form">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}  // Start with 1 row for compactness
            className="w-full resize-none rounded-2xl text-[var(--text-primary)] bg-[var(--input-color)] border border-[var(--border-color)] min-h-[48px] placeholder:text-[var(--text-secondary)] pl-4 pr-12 py-3 focus:ring-2 focus:ring-[var(--primary-color)]/50 focus:outline-none transition-all duration-200 font-inter text-[17px]"  // Increased font size
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Type your legal question here"
          />
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full text-white transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"  // Icon-only, circular, pulse on focus
            style={{ background: 'var(--primary-color)' }}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-sm">send</span>  {/* Icon-only */}
          </button>
          {/* Character Counter (new) */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-3 text-xs text-[var(--text-secondary)]">
              {message.length}/500  {/* Limit for usability */}
            </div>
          )}
        </form>
        <p className="text-[var(--text-secondary)] text-xs pt-2 px-2 text-center font-inter">  {/* Inter font */}
          AI Assistant can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  )
}