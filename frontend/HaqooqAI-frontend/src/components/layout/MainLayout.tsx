import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  forceCollapseSidebar?: boolean
}

export function MainLayout({ children, className, forceCollapseSidebar }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  // Auto-collapse sidebar for chat routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (isChatRoute || forceCollapseSidebar) {
      setSidebarOpen(false)
    } else {
      // Restore sidebar state for non-chat routes
      const savedState = localStorage.getItem('sidebar-open')
      if (savedState !== null) {
        setSidebarOpen(JSON.parse(savedState))
      }
    }
  }, [location.pathname, forceCollapseSidebar])

  // Save sidebar state for non-chat routes
  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute && !forceCollapseSidebar) {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen, location.pathname, forceCollapseSidebar])

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Enhanced Sidebar with better width */}
      <Sidebar
        isOpen={sidebarOpen}
      />

      {/* Main content area with dynamic width based on sidebar state */}
      <div className={cn(
        "flex flex-col min-w-0 relative transition-all duration-500 ease-in-out",
        // Dynamic width based on sidebar state
        sidebarOpen ? "flex-1" : "w-full"
      )}>
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.05)_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

        {/* Enhanced Header */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Main content with dynamic padding and width based on route and sidebar state */}
        <main className={cn(
          "flex-1 overflow-hidden relative z-10",
          "transition-all duration-500 ease-in-out",
          // Dynamic padding based on route
          location.pathname.startsWith('/chat/') || forceCollapseSidebar
            ? ""
            : "p-6 lg:p-8 xl:p-12",
          className
        )}>
          <div className={cn(
            "h-full transition-all duration-500 ease-in-out",
            // Dynamic max-width based on sidebar state for chat routes
            location.pathname.startsWith('/chat/')
              ? sidebarOpen
                ? "max-w-none w-full"
                : "max-w-none w-full"
              : "w-full max-w-none"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
