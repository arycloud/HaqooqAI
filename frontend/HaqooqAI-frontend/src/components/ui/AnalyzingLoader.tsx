// src/components/chat/AnalyzingLoader.tsx
import { useState, useEffect } from "react";
import { TextShimmer } from "@/components/core/text-shimmer";

const ANALYZING_STEPS = [
  { main: "HaqooqAI is Thinking…" },
  { main: "Checking the scope of your query..." },
  { main: "Searching my legal knowledge base..." },
  { main: "Invoking the web search to grab latest info..." },
  { main: "Crafting a compelling response…" },
  { main: "Be ready! I'm shipping the response..." },
];

export function AnalyzingLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setStepIndex((prev) => (prev + 1) % ANALYZING_STEPS.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  const step = ANALYZING_STEPS[stepIndex];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-md animate-in fade-in-50">
      {/* Spinner */}
      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />

      {/* Shimmer text */}
      <TextShimmer
        className="text-lg"
        duration={2}
        key={stepIndex}
      >
        {step.main}
      </TextShimmer>
    </div>
  );
}
