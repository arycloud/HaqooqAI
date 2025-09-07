import { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import SidebarNew from './SidebarNew'
import { Header } from './Header'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute) {
      const savedState = localStorage.getItem('sidebar-open')
      if (savedState !== null) setSidebarOpen(JSON.parse(savedState))
      else setSidebarOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    const isChatRoute = location.pathname.startsWith('/chat/')
    if (!isChatRoute) localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
  }, [sidebarOpen, location.pathname])

  return (
    <div className="h-screen flex bg-[var(--background-color)]">
      {!location.pathname.startsWith('/chat/') && <SidebarNew isOpen={sidebarOpen} />}

      <div className={cn(
        "flex flex-col min-w-0 relative transition-all duration-500 ease-in-out",
        !location.pathname.startsWith('/chat/') && sidebarOpen ? "ml-80 w-[calc(100%-320px)]" : "w-full"
      )}>
        {/* soft dotted grid */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        {!location.pathname.startsWith('/chat/') && (
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        )}

        <main className={cn(
          "flex-1 overflow-hidden relative z-10 transition-all duration-500 ease-in-out",
          location.pathname.startsWith('/chat/') ? "" : "p-6 lg:p-8 xl:p-12"
        )}>
          <div className={cn(
            "h-full transition-all duration-500 ease-in-out",
            location.pathname.startsWith('/chat/') ? "max-w-none w-full" : "w-full max-w-none"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
