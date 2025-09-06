import React from 'react'
import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,   // 30 minutes - data stays fresh longer
      gcTime: 60 * 60 * 1000,     // 1 hour - keep in cache longer
      retry: 2,                   // Retry twice on failure
      retryDelay: 1000,          // 1 second delay between retries
      refetchOnMount: false,      // Don't refetch on component mount
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnReconnect: false,  // Don't refetch when reconnecting
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
