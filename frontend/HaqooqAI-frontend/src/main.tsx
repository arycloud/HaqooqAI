import React from 'react'
import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './utils/axiosConfig' // Import axios configuration

import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,        // NEVER consider data stale automatically
      gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache much longer
      retry: 1,                   // Only retry once on failure
      retryDelay: 2000,          // 2 second delay between retries
      refetchOnMount: false,      // NEVER refetch on component mount
      refetchOnWindowFocus: false, // NEVER refetch when window gains focus
      refetchOnReconnect: false,  // NEVER refetch when reconnecting
      refetchInterval: false,     // NEVER refetch automatically
      refetchIntervalInBackground: false, // NEVER refetch in background
      networkMode: 'offlineFirst', // Use cache first, network second
    },
  },
})

import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({ storage: window.localStorage })

persistQueryClient({
  queryClient,
  persister,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter basename="/">
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </HashRouter>
      {/* Enable React Query Devtools
      <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </React.StrictMode>,
)
