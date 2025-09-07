import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number; // seconds
}

export function TextShimmer({ children, className, duration = 2 }: TextShimmerProps) {
  return (
    <span
      className={cn(
        "relative inline-block bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-[length:200%_100%] text-transparent bg-clip-text animate-text-shimmer animate-pulse",
        className
      )}
      style={{
        animationDuration: `${duration}s`
      }}
    >
      {children}
    </span>
  )
}

