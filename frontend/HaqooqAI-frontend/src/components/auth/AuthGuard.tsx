import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
// import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InitialLoader } from '@/components/ui/InitialLoader';

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Check if we're currently processing an OAuth callback
  const isProcessingOAuth = () => {
    const hashParams = new URLSearchParams(location.hash.substring(1))
    const urlParams = new URLSearchParams(location.search)
    return !!(hashParams.get('access_token') || urlParams.get('access_token'))
  }

  const isDevelopmentMode = import.meta.env.VITE_REACT_APP_ENV === 'development';
  console.log('Development Mode:', isDevelopmentMode);
  console.log('User Authenticated:', isAuthenticated);
  if (isDevelopmentMode) {
    console.warn('Authentication bypassed in development mode');
    return <>{children}</>;
  } 


  useEffect(() => {
    // If we're on a protected route and not authenticated,
    // the redirect will happen automatically
  }, [isAuthenticated, location])

  // Show loading while authenticating or processing OAuth callback
  if (loading || isProcessingOAuth()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* <LoadingSpinner size="lg" className="mx-auto mb-4" /> */}
          <InitialLoader />
          <p className="text-gray-600">
            {isProcessingOAuth() ? 'Completing authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    // Redirect to login with the current location as state
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
