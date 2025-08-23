import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User } from '@/types/auth'
import { authService } from '@/services/backend/authService'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check for GitHub OAuth callback
      const urlParams = new URLSearchParams(location.search)
      const accessToken = urlParams.get('access_token')
      const error = urlParams.get('error')

      if (error) {
        throw new Error(`GitHub OAuth error: ${error}`)
      }

      if (accessToken) {
        // Handle GitHub callback with access token
        await handleGitHubToken(accessToken)
        return
      }

      // Check existing session
      const session = await authService.checkExistingSession()
      if (session) {
        setUser(session.user)
        authService.storeUser(session.user)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Auth initialization error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGitHubToken = async (accessToken: string) => {
    try {
      // Store the token
      localStorage.setItem('github_token', accessToken)

      // Validate token and get user data
      const { user: authenticatedUser } = await authService.validateToken(accessToken)
      setUser(authenticatedUser)
      authService.storeUser(authenticatedUser)

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Navigate to dashboard
      navigate('/', { replace: true })

      toast.success(`Welcome back, ${authenticatedUser.username}!`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'GitHub authentication failed'
      setError(errorMessage)
      toast.error(errorMessage)
      navigate('/login', { replace: true })
      throw err
    }
  }



  const login = () => {
    try {
      authService.loginWithGitHub()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate login'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
      setUser(null)
      setError(null)
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    authService.storeUser(updatedUser)
  }

  const refreshAuth = async () => {
    try {
      setLoading(true)
      const session = await authService.checkExistingSession()
      if (session) {
        setUser(session.user)
        authService.storeUser(session.user)
      } else {
        setUser(null)
        navigate('/login', { replace: true })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh authentication'
      setError(errorMessage)
      setUser(null)
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    refreshAuth,
    isAuthenticated: !!user,
  }
}
