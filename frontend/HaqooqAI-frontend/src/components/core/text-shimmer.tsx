import { cn } from "@/lib/utils";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number; // seconds
}

export function TextShimmer({ children, className, duration = 2 }: TextShimmerProps) {
  return (
    <span
      className={cn("text-shimmer", className)}
      style={{ animationDuration: `${duration}s` }}
    >
      {children}
    </span>
  )
}
