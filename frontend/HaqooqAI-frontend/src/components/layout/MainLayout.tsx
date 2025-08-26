import { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  // Auto-collapse sidebar for chat routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (isChatRoute) {
      setSidebarOpen(false)
    } else {
      const savedState = localStorage.getItem('sidebar-open')
      if (savedState !== null) {
        setSidebarOpen(JSON.parse(savedState))
      }
    }
  }, [location.pathname])

  // Save sidebar state for non-chat routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute) {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen, location.pathname])

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar stays mounted */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col min-w-0 relative transition-all duration-500 ease-in-out",
          sidebarOpen ? "flex-1" : "w-full"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.05)_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

        {/* Outlet for nested pages */}
        <main
          className={cn(
            "flex-1 overflow-hidden relative z-10 transition-all duration-500 ease-in-out",
            location.pathname.startsWith('/chat/') ? "" : "p-6 lg:p-8 xl:p-12"
          )}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-in-out",
              location.pathname.startsWith('/chat/')
                ? "max-w-none w-full"
                : "w-full max-w-none"
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
