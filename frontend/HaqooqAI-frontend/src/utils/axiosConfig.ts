import axios from 'axios'
import toast from 'react-hot-toast'
import { authService } from '@/services/backend/authService'

// Helper function to trigger connection error events
function triggerConnectionError(type: 'server' | 'network', message: string) {
  const event = new CustomEvent('connection-error', {
    detail: { type, message }
  })
  window.dispatchEvent(event)
}

// Global axios configuration for better error handling
axios.defaults.timeout = 15000 // 15 second timeout

// Response interceptor to handle 502 Bad Gateway and other server errors
axios.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const config = error.config
      
      // Handle authentication errors (token expiration)
      if (status === 401) {
        console.warn('Authentication failed - token may have expired')
        
        // Check if this is specifically a token expiration error
        const isTokenExpired = 
          error.response?.headers['x-auth-token-expired'] === 'true' ||
          error.response?.data?.error === 'INVALID_TOKEN' ||
          (error.response?.data?.details?.token_expired === true) ||
          (typeof error.response?.data?.message === 'string' && 
           error.response.data.message.includes('expired'))
        
        if (isTokenExpired) {
          console.log('Token expired detected, logging out user')
          // Automatically log out the user
          await authService.logout()
          
          // Dispatch a custom event so other parts of the app can react
          const event = new CustomEvent('auth-expired', {
            detail: { message: 'Your session has expired. Please log in again.' }
          })
          window.dispatchEvent(event)
          
          // Show a toast notification
          toast.error('Your session has expired. Please log in again.', {
            duration: 5000,
            id: 'auth-expired'
          })
          
          // Redirect to login page
          // We can't directly navigate here, so we'll rely on the auth store reset
          // The AuthGuard will handle the actual redirect
        }
        
        // Don't show toast for other auth errors - let the auth service handle it
        return Promise.reject(error)
      }
      
      // Handle 502 Bad Gateway specifically
      else if (status === 502) {
        console.warn('502 Bad Gateway detected, backend may be temporarily unavailable')
        
        // Trigger connection error event for UI components
        triggerConnectionError('server', 'Backend service temporarily unavailable')
        
        // Show user-friendly message for 502 errors
        if (!config?.url?.includes('/validate') && !config?.url?.includes('/conversations')) {
          toast.error('Service temporarily unavailable. Please try again in a moment.', {
            duration: 3000,
            id: 'server-502-error' // Prevent duplicate toasts
          })
        }
      }
      
      // Handle other server errors
      else if (status === 503 || status === 504) {
        console.warn(`Server error ${status} detected`)
        triggerConnectionError('server', `Server error ${status} - Service unavailable`)
        
        if (!config?.url?.includes('/validate')) {
          toast.error('Service temporarily unavailable. Please try again later.', {
            duration: 3000,
            id: 'server-error'
          })
        }
      }
      
      // Handle network errors (no response)
      else if (!error.response) {
        console.warn('Network error: No response from server')
        triggerConnectionError('network', 'Connection failed - Check your internet')
        
        if (!config?.url?.includes('/validate')) {
          toast.error('Connection failed. Please check your internet connection.', {
            duration: 3000,
            id: 'network-error'
          })
        }
      }
    }
    
    // Always reject the promise to maintain normal error flow
    return Promise.reject(error)
  }
)

// Request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    // Add timestamp to help with debugging
    // @ts-ignore - Adding custom metadata property
    config.metadata = { startTime: new Date() }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default axios