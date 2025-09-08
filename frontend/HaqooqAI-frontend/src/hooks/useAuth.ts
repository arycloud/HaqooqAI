import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/services/backend/authService'
import { STORAGE_KEYS } from '@/utils/constants'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types/auth'

export const useAuth = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Zustand store values
  const {
    user,
    setUser,
    reset,
    isAuthenticated,
    setError,
    setLoading,
  } = useAuthStore()

  const [error, _setError] = useState<string | null>(null) // local error mirror
  const [loading, _setLoading] = useState(true) // local loading mirror

  useEffect(() => {
    initializeAuth()
  }, [])

  /** ---------------------------
   * Initialize Auth on App Load
   * --------------------------- */
  const initializeAuth = async () => {
    try {
      setLoading(true)
      _setLoading(true)
      _setError(null)
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
      if (token && !user) {
        await validateSession(token)
      }
    } catch (err) {
      handleAuthError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
      _setLoading(false)
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
          reset()
          navigate('/login', { replace: true })
        }
      } else {
        reset()
        navigate('/login', { replace: true })
      }
    }
  }

  /** ---------------------------
   * Unified Error Handling
   * --------------------------- */
  const handleAuthError = (message: string, redirectToLogin = false) => {
    _setError(message)
    setError(message)
    toast.error(message)
    console.error('Auth Error:', message)

    window.history.replaceState({}, document.title, location.pathname)

    if (redirectToLogin) {
      reset()
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
      _setLoading(true)
      await authService.logout()
      reset()
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    } catch (err) {
      handleAuthError(err instanceof Error ? err.message : 'Logout failed')
    } finally {
      setLoading(false)
      _setLoading(false)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const refreshAuth = async () => {
    try {
      setLoading(true)
      _setLoading(true)
      const session = await authService.checkExistingSession()
      if (session?.user) {
        setUser(session.user)
      } else {
        reset()
        navigate('/login', { replace: true })
      }
    } catch (err) {
      handleAuthError(
        err instanceof Error ? err.message : 'Failed to refresh authentication',
        true
      )
      reset()
    } finally {
      setLoading(false)
      _setLoading(false)
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
    isAuthenticated,
  }
}
