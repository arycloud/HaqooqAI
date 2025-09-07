import { useState, useEffect } from 'react'
import { TextShimmer } from '@/components/core/text-shimmer'

export type LoaderType = 'analyzing' | 'setup' | 'fetching' | 'general' | 'messages'

interface CyclingLoaderProps {
  type?: LoaderType
}

const LOADING_MESSAGES: Record<LoaderType, string[]> = {
  analyzing: [
    "HaqooqAI is thinking...",
    "Analyzing your legal query...",
    "Consulting legal database...",
    "Processing with AI expertise...",
    "Searching Pakistani law...",
    "Gathering relevant sources...",
    "Preparing comprehensive response..."
  ],
  setup: [
    "Setting up conversation...",
    "Initializing chat session...",
    "Preparing legal assistant...",
    "Ready to help with law..."
  ],
  fetching: [
    "Loading conversation...",
    "Retrieving messages...",
    "Fetching chat history...",
    "Loading previous discussions..."
  ],
  messages: [
    "Loading messages...",
    "Retrieving conversation data...",
    "Fetching chat history...",
    "Loading previous messages..."
  ],
  general: [
    "Processing request...",
    "Please wait...",
    "Loading...",
    "Working on it..."
  ]
}

export function CyclingLoader({ type = 'general' }: CyclingLoaderProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const messages = LOADING_MESSAGES[type] ?? LOADING_MESSAGES.general

  // reset when type changes
  useEffect(() => {
    setCurrentMessageIndex(0)
  }, [type])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((p) => (p + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="flex items-center space-x-4 py-2 px-0">
      <div className="relative flex-shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined text-[var(--primary-color)] text-base animate-pulse">balance</span>
          <div className="absolute inset-0 w-5 h-5 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="absolute inset-0 w-5 h-5 bg-[var(--primary-color)]/20 rounded-full blur-sm animate-pulse" />
      </div>

      <div className="flex-1">
        <TextShimmer className="text-sm text-[var(--text-secondary)] font-medium" duration={1.5} key={`shimmer-${type}-${currentMessageIndex}`}>
          {messages[currentMessageIndex]}
        </TextShimmer>
      </div>

      <div className="flex items-center space-x-1">
        <div className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-[var(--secondary-color)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
