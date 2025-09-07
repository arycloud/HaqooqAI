// src/components/layout/MainLayout.tsx
import React, { useState } from 'react'
import SidebarNew from './SidebarNew' // default import
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[var(--background-color)]">
      {/* Desktop permanent sidebar */}
      <div className={cn("hidden lg:block lg:w-80")}>
        <SidebarNew isOpen={true} />
      </div>

      {/* Mobile togglable sidebar (overlays when open) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 h-full">
            <SidebarNew isOpen={true} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* top toolbar for mobile */}
        <div className="lg:hidden p-3 border-b border-[var(--border-color)]">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-md hover:bg-[var(--hover-color)] transition">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
