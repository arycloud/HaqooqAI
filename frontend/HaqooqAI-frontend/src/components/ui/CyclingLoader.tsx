import { useState, useEffect } from 'react'

export type LoaderType = 'analyzing' | 'setup' | 'fetching' | 'general' | 'messages'

interface CyclingLoaderProps {
  type?: LoaderType
}

const LOADING_MESSAGES: Record<LoaderType, { main: string; sub: string }[]> = {
  analyzing: [
    { main: "Thinking…", sub: "Analyzing your question…" },
    { main: "Preparing response…", sub: "Gathering legal knowledge…" },
    { main: "Checking details…", sub: "Reviewing query scope…" }
  ],
  setup: [
    { main: "Setting up the conversation…", sub: "Gearing up the conversation for you…" },
    { main: "Preparing assistant…", sub: "Initializing legal support…" }
  ],
  fetching: [
    { main: "Loading previous messages…", sub: "Loading chat history…" },
    { main: "Retrieving conversation…", sub: "Bringing past discussions…" }
  ],
  messages: [
    { main: "Loading messages…", sub: "Loading chat history…" },
    { main: "Fetching conversation…", sub: "Retrieving stored messages…" }
  ],
  general: [
    { main: "Working on it…", sub: "Please wait a moment…" }
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
    }, 2500)
    return () => clearInterval(interval)
  }, [messages.length])

  const { main, sub } = messages[currentMessageIndex]

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
      {/* Big Circular Spinner */}
      <div className="relative mb-6">
        <div className="w-14 h-14 rounded-full border-4 border-[var(--border-color)] border-t-[var(--primary-color)] animate-spin" />
      </div>

      {/* Main message */}
      <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {main}
      </p>

      {/* Sub message */}
      <p className="text-sm text-[var(--text-secondary)]">
        {sub}
      </p>
    </div>
  )
}
