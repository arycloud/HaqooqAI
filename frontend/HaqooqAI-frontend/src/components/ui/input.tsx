import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Enhanced input styling with larger size and better prominence
          "flex h-14 lg:h-16 w-full rounded-2xl border-2 px-6 lg:px-8 py-4 lg:py-5 text-base lg:text-lg font-medium transition-all duration-200",
          // Light mode colors
          "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500",
          // Dark mode colors
          "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400",
          // Enhanced focus states
          "focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500",
          "dark:focus:ring-purple-400/20 dark:focus:border-purple-400",
          // Enhanced hover states
          "hover:border-gray-300 hover:shadow-md dark:hover:border-gray-500",
          // Disabled states
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800",
          // Enhanced shadow
          "shadow-sm hover:shadow-md focus:shadow-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
