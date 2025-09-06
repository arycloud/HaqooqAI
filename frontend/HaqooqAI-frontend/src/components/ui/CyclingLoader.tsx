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
    <div className="flex items-center space-x-3 p-6">
      {/* Spinner - Left aligned */}
      <div className="relative flex-shrink-0">
        <Scale className="w-8 h-8 text-purple-400 animate-pulse" />
        <div className="absolute inset-0 w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
      
      {/* Text with shimmer effect */}
      <div className="flex flex-col space-y-1">
        <TextEffect 
          per="char" 
          preset="scale"
          className="text-lg font-medium text-gray-800"
          trigger={true}
        >
          {getLoaderTitle(type)}
        </TextEffect>
        <TextEffect 
          per="word" 
          preset="blur"
          className="text-sm text-gray-600"
          trigger={true}
        >
          {messages[currentMessageIndex]}
        </TextEffect>
      </div>
    </div>
  )
}