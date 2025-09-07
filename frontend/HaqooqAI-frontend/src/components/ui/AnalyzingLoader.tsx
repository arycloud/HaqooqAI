// src/components/chat/AnalyzingLoader.tsx
import { useState, useEffect } from 'react'
import { TextShimmer } from '@/components/core/text-shimmer'

const ANALYZING_STEPS = [
  { main: "HaqooqAI is Thinking…"},
  { main: "Checking the scope of your query..."},
  { main: "Searching my legal knowledge base...."},
  { main: "Invoking the web search to grab latest info...."},
  { main: "Checking details…"},
  { main: "Crafting a compelling response…"},
  { main: "Be ready! I'm shipping the response...."},
  
]

export function AnalyzingLoader() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % ANALYZING_STEPS.length)
    }, 2500) // rotate every 2.5s
    return () => clearInterval(interval)
  }, [])

  const step = ANALYZING_STEPS[stepIndex]

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bubble-assistant-bg)] shadow-lg max-w-md animate-in fade-in-50">
      {/* Circular Spinner */}
      <div className="relative flex-shrink-0">
        <div className="w-6 h-6 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
      </div>

      {/* Shimmer Texts */}
      <div className="flex flex-col">
        <TextShimmer className="font-semibold text-[15px] text-white">
            {step.main}
        </TextShimmer>
        {/* <TextShimmer
          className="text-[14px] text-[var(--text-secondary)] mt-1"
          duration={2.2}
          key={`sub-${stepIndex}`}
        >
          {step.sub}
        </TextShimmer> */}
      </div>
    </div>
  )
}
