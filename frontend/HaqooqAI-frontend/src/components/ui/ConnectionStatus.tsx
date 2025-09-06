import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ConnectionStatusProps {
  className?: string
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastError, setLastError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (lastError) {
        toast.success('Connection restored', { id: 'connection-status' })
        setLastError(null)
        setShowError(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setLastError('No internet connection')
      setShowError(true)
      toast.error('Connection lost', { id: 'connection-status' })
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for custom connection error events
    const handleConnectionError = (event: CustomEvent) => {
      const { type, message } = event.detail
      setLastError(message)
      setShowError(true)
      
      // Auto-hide after 10 seconds for server errors
      if (type === 'server') {
        setTimeout(() => {
          setShowError(false)
          setLastError(null)
        }, 10000)
      }
    }

    window.addEventListener('connection-error', handleConnectionError as EventListener)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('connection-error', handleConnectionError as EventListener)
    }
  }, [lastError])

  if (!showError && isOnline) {
    return null
  }

  return (
    <div className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border",
      !isOnline 
        ? "bg-red-500/90 border-red-400 text-white" 
        : "bg-yellow-500/90 border-yellow-400 text-white",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          !isOnline ? "bg-red-200" : "bg-yellow-200"
        )} />
        <span className="text-sm font-medium">
          {!isOnline ? 'No internet connection' : lastError}
        </span>
      </div>
    </div>
  )
}

// Helper function to trigger connection error events
export function triggerConnectionError(type: 'server' | 'network', message: string) {
  const event = new CustomEvent('connection-error', {
    detail: { type, message }
  })
  window.dispatchEvent(event)
}