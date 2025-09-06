import axios from 'axios'
import toast from 'react-hot-toast'

// Helper function to trigger connection error events
function triggerConnectionError(type: 'server' | 'network', message: string) {
  const event = new CustomEvent('connection-error', {
    detail: { type, message }
  })
  window.dispatchEvent(event)
}

// Global axios configuration for better error handling
axios.defaults.timeout = 10000 // 10 second timeout

// Response interceptor to handle 502 Bad Gateway and other server errors
axios.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const config = error.config
      
      // Handle 502 Bad Gateway specifically
      if (status === 502) {
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
      
      // Handle authentication errors
      else if (status === 401) {
        console.warn('Authentication failed')
        // Don't show toast for auth errors - let the auth service handle it
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