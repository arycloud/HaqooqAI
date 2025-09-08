import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const messages = [
  'HaqooqAI is loading...',
  'This wait is shorter than resolving a property dispute case in Pakistani courts!',
  'Scanning through Pakistan\'s legal documents faster than a patwari finds a fard...',
  'Loading faster than politicians debate the federal budget in Parliament!'
];

export function InitialLoader({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // Cycle every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center bg-background z-50',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-32 h-32 text-purple-400 mb-8"
      >
        <path d="m16 16 3-8 3 8c-.87 .65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
        <path d="m2 16 3-8 3 8c-.87 .65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
        <path d="M7 21h10"></path>
        <path d="M12 3v18"></path>
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
      </svg>
      <div className="w-96 h-24 relative overflow-hidden">
        <p
          key={currentIndex} // Remounts to restart animation on change
          className="absolute inset-x-0 text-center text-lg text-muted-foreground animate-[moveUpFade_3s_ease-in-out]"
        >
          {messages[currentIndex]}
        </p>
      </div>
    </div>
  );
}