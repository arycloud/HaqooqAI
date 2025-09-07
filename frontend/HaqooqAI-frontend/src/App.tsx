import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { Settings } from '@/pages/Settings'
// import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InitialLoader } from '@/components/ui/InitialLoader';
import { MainLayout} from '@/components/layout/MainLayout'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useQueryClient } from '@tanstack/react-query'
import { conversationService } from '@/services/backend/conversationService'
import { useEffect } from 'react'

function App() {
  const { loading, user } = useAuth()
  const queryClient = useQueryClient()

  // Prefetch conversations when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      const userQueryKey = ['conversations', user?.github_id ?? user?.id ?? 'guest']
      
      // Only prefetch if not already in cache
      if (!queryClient.getQueryData(userQueryKey)) {
        queryClient.prefetchQuery({
          queryKey: userQueryKey,
          queryFn: () => conversationService.getConversations(),
          staleTime: 30 * 60 * 1000, // 30 minutes
        })
      }
    }
  }, [user, loading, queryClient])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* <LoadingSpinner size="lg" /> */}
        <InitialLoader />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Chat routes - standalone without MainLayout */}
        <Route
          path="/chat/:conversationId?"
          element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          }
        />

        {/* Other authenticated routes share MainLayout */}
        <Route
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
