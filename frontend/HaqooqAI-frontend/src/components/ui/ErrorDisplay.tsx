import { AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  showSettingsButton?: boolean
}

export function ErrorDisplay({ error, onRetry, showSettingsButton = false }: ErrorDisplayProps) {
  const navigate = useNavigate()

  const getErrorType = (error: string) => {
    if (error.includes('API key')) return 'api_key'
    if (error.includes('quota exceeded')) return 'quota'
    if (error.includes('unavailable')) return 'service'
    if (error.includes('authentication')) return 'auth'
    return 'general'
  }

  const getErrorSuggestion = (errorType: string) => {
    switch (errorType) {
      case 'api_key':
        return 'Check your API key configuration in Settings or try using a different provider.'
      case 'quota':
        return 'You have reached your daily quota. Add your own API key for unlimited access.'
      case 'service':
        return 'The service is temporarily unavailable. Try again in a few moments.'
      case 'auth':
        return 'Your session has expired. Please log in again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const errorType = getErrorType(error)
  const suggestion = getErrorSuggestion(errorType)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <motion.div
            className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </motion.div>
        <CardTitle className="text-lg">Something went wrong</CardTitle>
        <CardDescription className="text-sm">
          {error}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          {suggestion}
        </p>
        
        <div className="flex flex-col space-y-2">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {(showSettingsButton || errorType === 'api_key' || errorType === 'quota') && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </motion.div>
  )
}