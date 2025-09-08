// src/components/core/text-shimmer.tsx
import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function TextShimmer({ children, className, duration = 2 }: TextShimmerProps) {
  return (
    <span
      className={cn(
        "relative inline-block font-medium text-transparent bg-clip-text",
        "bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_100%]",
        "animate-text-shimmer-ltr",
        className
      )}
      style={{ animationDuration: `${duration}s` }}
    >
      {children}
    </span>
  );
}
