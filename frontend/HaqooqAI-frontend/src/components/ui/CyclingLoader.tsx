import { useState, useEffect } from 'react'
import { Scale } from 'lucide-react'

type LoaderType = 'analyzing' | 'setup' | 'fetching' | 'general'

interface CyclingLoaderProps {
  type?: LoaderType
}

const LOADING_MESSAGES = {
  analyzing: [
    "Analyzing your legal query...",
    "Routing to best AI provider...",
    "Selecting optimal model...",
    "Processing with legal expertise...",
    "Searching legal documents...",
    "Consulting Pakistani law database...",
    "Gathering relevant sources...",
    "Formatting comprehensive response..."
  ],
  setup: [
    "Setting up new conversation...",
    "Initializing chat session...",
    "Preparing legal assistant...",
    "Ready to help with Pakistani law..."
  ],
  fetching: [
    "Loading conversation history...",
    "Retrieving messages...",
    "Fetching previous discussions...",
    "Loading chat data..."
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
      default:
        return 'Processing...'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative">
        <Scale className="w-12 h-12 text-purple-400 animate-pulse" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-800">
          {getLoaderTitle(type)}
        </p>
        <p className="text-sm text-gray-600">
          {messages[currentMessageIndex]}
        </p>
        <p className="text-xs text-gray-500">
          Powered by AI legal expertise
        </p>
      </div>
    </div>
  )
}