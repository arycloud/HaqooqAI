import { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { SidebarNew } from './SidebarNew'
import { Header } from './Header'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start with sidebar closed
  const location = useLocation()

  // Handle sidebar state for all routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute) {
      // For non-chat routes, restore saved state or default to open
      const savedState = localStorage.getItem('sidebar-open')
      if (savedState !== null) {
        setSidebarOpen(JSON.parse(savedState))
      } else {
        setSidebarOpen(true) // Default open for non-chat routes
      }
    }
    // For chat routes, keep current state (don't force close)
  }, [location.pathname])

  // Save sidebar state for non-chat routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute) {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen, location.pathname])

  return (
    <div className="h-screen flex bg-[var(--background-color)]">
      {/* Sidebar stays mounted */}
      <SidebarNew isOpen={sidebarOpen} />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col min-w-0 relative transition-all duration-500 ease-in-out",
          sidebarOpen ? "ml-80 w-[calc(100%-320px)]" : "w-full"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(200,80,192,0.05)_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

        {/* Conditionally render Header - hide for chat routes */}
        {!location.pathname.startsWith('/chat/') && (
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        )}

        {/* Outlet for nested pages - pass sidebar controls to chat routes */}
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
            {/* Pass sidebar controls as context for chat routes */}
            {location.pathname.startsWith('/chat/') ? (
              <div className="h-full" data-sidebar-open={sidebarOpen} data-toggle-sidebar={() => setSidebarOpen(!sidebarOpen)}>
                <Outlet context={{ sidebarOpen, toggleSidebar: () => setSidebarOpen(!sidebarOpen) }} />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
