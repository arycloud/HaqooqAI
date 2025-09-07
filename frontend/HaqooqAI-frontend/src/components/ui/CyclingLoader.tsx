import { useState, useEffect } from 'react'
import { Scale } from 'lucide-react'
import { TextShimmer } from '@/components/core/text-shimmer'

export type LoaderType = 'analyzing' | 'setup' | 'fetching' | 'general' | 'messages'

interface CyclingLoaderProps {
  type?: LoaderType
}

const LOADING_MESSAGES = {
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
  const messages = LOADING_MESSAGES[type]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [messages.length])

  const getLoaderTitle = (type: LoaderType) => {
    switch (type) {
      case 'analyzing':
        return 'AI is thinking...'
      case 'setup':
        return 'Setting up conversation...'
      case 'fetching':
        return 'Loading conversation...'
      case 'messages':
        return 'Loading messages...'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="flex items-center space-x-4 py-4 px-6">
      {/* Modern spinner with glow effect */}
      <div className="relative flex-shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined text-[var(--primary-color)] text-xl animate-pulse">balance</span>
          <div className="absolute inset-0 w-6 h-6 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin" />
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-6 h-6 bg-[var(--primary-color)]/20 rounded-full blur-sm animate-pulse" />
      </div>
      
      {/* Enhanced text with shimmer effect - only dynamic messages */}
      <div className="flex-1">
        <TextShimmer
        className="text-base font-medium"
        duration={1.5}
        key={`shimmer-${currentMessageIndex}`}
      >
        {messages[currentMessageIndex]}
      </TextShimmer>
      </div>
      
      {/* Animated dots indicator */}
      <div className="flex items-center space-x-1">
        <div className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-[var(--secondary-color)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-[var(--primary-color)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}