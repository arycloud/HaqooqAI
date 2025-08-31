import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface CyclingLoaderProps {
  type: 'messages' | 'analyzing';
  className?: string;
}

const messageSets = {
  messages: [
    'Preparing your HaqooqAI session faster than a court adjournment!',
    'Fetching messages quicker than a lawyer files a petition...'
  ],
  analyzing: [
    'HaqooqAI is analyzing your legal query...',
    'Scanning Pakistani statutes and case laws...',
    'Cross-referencing relevant provisions like a seasoned advocate...',
    'Formulating an accurate response with citations...',
    'Ensuring compliance insights faster than resolving a tehsil dispute!'
  ]
};

export function CyclingLoader({ type, className }: CyclingLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const messages = messageSets[type];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 2500); // Cycle every 2.5 seconds
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <LoadingSpinner size="sm" />
      <span
        key={currentIndex} // Remount for animation if desired
        className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium animate-fade-in"
      >
        {messages[currentIndex]}
      </span>
    </div>
  );
}