import { useState, useEffect } from 'react'
import { Scale } from 'lucide-react'
import { TextEffect } from '@/components/motion-primitives/text-effect'

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
          <Scale className="w-6 h-6 text-blue-500 animate-pulse" />
          <div className="absolute inset-0 w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-6 h-6 bg-blue-500/20 rounded-full blur-sm animate-pulse" />
      </div>
      
      {/* Enhanced text with shimmer effect */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getLoaderTitle(type)}
          </span>
        </div>
        
        <TextEffect 
          per="word" 
          preset="fade-in-blur"
          className="text-base text-gray-600 dark:text-gray-400 font-medium"
          trigger={true}
          key={`shimmer-${currentMessageIndex}`}
          speedReveal={1.2}
        >
          {messages[currentMessageIndex]}
        </TextEffect>
      </div>
      
      {/* Animated dots indicator */}
      <div className="flex items-center space-x-1">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}