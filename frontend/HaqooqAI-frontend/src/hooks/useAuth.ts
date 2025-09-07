import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User } from '@/types/auth'
import { authService } from '@/services/backend/authService'
import { STORAGE_KEYS } from '@/utils/constants'
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

  /** ---------------------------
   * Initialize Auth on App Load
   * --------------------------- */
  const initializeAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Handle OAuth callback
      const urlParams = new URLSearchParams(location.search)
      const hashParams = new URLSearchParams(location.hash.substring(1))

      let accessToken = hashParams.get('access_token') || urlParams.get('access_token')
      const oauthError = urlParams.get('error') || hashParams.get('error')

      if (oauthError) {
        const errorDescription =
          urlParams.get('error_description') ||
          hashParams.get('error_description') ||
          oauthError
        handleAuthError(`GitHub OAuth error: ${errorDescription}`, true)
        return
      }

      if (accessToken) {
        await handleGitHubToken(accessToken)
        return
      }

      // Fallback: check stored token/session
      const token = authService.getStoredToken()
      if (token) {
        await validateSession(token)
      }
    } catch (err) {
      handleAuthError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  /** ---------------------------
   * Handle OAuth GitHub Token
   * --------------------------- */
  const handleGitHubToken = async (accessToken: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, accessToken)

      const { user: authenticatedUser } = await authService.validateToken(accessToken)
      if (!authenticatedUser) throw new Error('No user data received from GitHub')

      setUser(authenticatedUser)
      authService.storeUser(authenticatedUser)

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)

      navigate('/', { replace: true })
      toast.success(`Welcome back, ${authenticatedUser.username}!`)
    } catch (err) {
      handleAuthError(
        err instanceof Error ? err.message : 'GitHub authentication failed',
        true
      )
      throw err
    }
  }

  /** ---------------------------
   * Validate Session with Token
   * --------------------------- */
  const validateSession = async (token: string) => {
    try {
      const auth = await authService.validateToken(token)
      if (auth?.user) {
        setUser(auth.user)
        authService.storeUser(auth.user)
      }
    } catch (tokenError) {
      const errorMessage =
        tokenError instanceof Error ? tokenError.message : 'Unknown error'

      if (
        errorMessage.includes('temporarily unavailable') ||
        errorMessage.includes('502') ||
        errorMessage.includes('Backend database schema needs update')
      ) {
        // Temporary server error — fallback to cached session
        const cachedUser = authService.getStoredUser()
        if (cachedUser) {
          setUser(cachedUser)
          if (errorMessage.includes('database schema')) {
            toast.error(
              'Backend service needs updating. Some features may be limited.',
              { duration: 5000 }
            )
          } else {
            toast.error('Connection issues detected. Some features may be limited.')
          }
        } else {
          authService.logout()
          navigate('/login', { replace: true })
        }
      } else {
        // Invalid token — force logout
        authService.logout()
        navigate('/login', { replace: true })
      }
    }
  }

  /** ---------------------------
   * Unified Error Handling
   * --------------------------- */
  const handleAuthError = (message: string, redirectToLogin = false) => {
    setError(message)
    toast.error(message)
    console.error('Auth Error:', message)

    // Clean URL
    window.history.replaceState({}, document.title, location.pathname)

    if (redirectToLogin) {
      authService.logout()
      navigate('/login', { replace: true })
    }
  }

  /** ---------------------------
   * Auth Actions
   * --------------------------- */
  const login = () => {
    try {
      authService.loginWithGitHub()
    } catch (err) {
      handleAuthError(
        err instanceof Error ? err.message : 'Failed to initiate login'
      )
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
      handleAuthError(err instanceof Error ? err.message : 'Logout failed')
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
      if (session?.user) {
        setUser(session.user)
        authService.storeUser(session.user)
      } else {
        setUser(null)
        navigate('/login', { replace: true })
      }
    } catch (err) {
      handleAuthError(
        err instanceof Error ? err.message : 'Failed to refresh authentication',
        true
      )
      setUser(null)
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
