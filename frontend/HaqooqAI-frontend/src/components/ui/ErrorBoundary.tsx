import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service if available
    if (typeof window !== 'undefined' && window.console) {
      console.error('Error caught by boundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Check if this is an authentication-related error
      const isAuthError = this.state.error?.message?.includes('Authentication') ||
                         this.state.error?.message?.includes('token') ||
                         this.state.error?.message?.includes('login')

      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background-color)]">
          <Card className="w-full max-w-md border border-[var(--border-color)] bg-[var(--sidebar-color)]">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
              </div>
              <CardTitle className="text-[var(--text-primary)]">
                {isAuthError ? 'Authentication Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription className="text-[var(--text-secondary)]">
                {isAuthError 
                  ? 'There was a problem with authentication. This might be due to a backend service issue.'
                  : 'An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-[var(--text-secondary)] border border-[var(--border-color)] rounded p-2">
                  <summary className="cursor-pointer mb-2 font-medium">Error Details</summary>
                  <div className="space-y-2">
                    <p><strong>Error:</strong> {this.state.error?.message}</p>
                    {this.state.error?.stack && (
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              
              {isAuthError && (
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}