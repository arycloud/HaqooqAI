import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { Settings } from '@/pages/Settings'
// import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InitialLoader } from '@/components/ui/InitialLoader';
import { MainLayout } from '@/components/layout/MainLayout'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* <LoadingSpinner size="lg" /> */}
        <InitialLoader />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* All authenticated routes share MainLayout */}
      <Route
        element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat/:conversationId?" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
