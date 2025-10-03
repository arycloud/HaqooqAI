import { Menu, Settings, LogOut, User } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QuotaBadge } from './QuotaBadge'
import { authService } from '@/services/backend/authService'

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen: boolean
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  return (
    <header className="sticky top-0 h-16 lg:h-16 bg-[var(--background-color)] border-b border-[var(--border-color)] flex items-center justify-between px-8 lg:px-12 z-20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Left side with larger elements */}
      <div className="flex items-center relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="mr-4 w-12 h-12 lg:w-14 lg:h-14 hover:bg-[var(--hover-color)] transition-all duration-200 rounded-xl"
        >
          <Menu className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
        </Button>

        <div className="flex items-center space-x-4">
          <Link to="/" className="text-xl font-bold hidden md:block">
            <div className="w-12 h-10 lg:w-10 lg:h-10 rounded-2xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg lg:text-xl">H</span>
            </div>
          </Link>
          <Link to="/" className="text-xl font-bold hidden md:block">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              HaqooqAI
            </h1>
          </Link>
        </div>
      </div>

      {/* Right side with larger elements */}
      <div className="flex items-center space-x-6 relative z-10">
        {/* Enhanced Quota Display */}
        <div className="hidden sm:block">
          <QuotaBadge />
        </div>

        {/* Enhanced User Menu with larger elements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-4 px-4 py-3 lg:px-5 lg:py-4 rounded-2xl hover:bg-[var(--hover-color)] transition-all duration-200 group"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-11 h-11 lg:w-10 lg:h-10 rounded-full ring-2 ring-[var(--border-color)] group-hover:ring-[var(--primary-color)] transition-all duration-200"
                />
              ) : (
                <div className="w-11 h-11 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center ring-2 ring-[var(--border-color)] group-hover:ring-[var(--primary-color)] transition-all duration-200">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              )}
              <span className="hidden md:block text-base lg:text-lg font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors duration-200">
                {user?.username}
              </span>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 bg-[var(--sidebar-color)] border border-[var(--border-color)] shadow-xl rounded-xl"
          >
            <div className="px-3 py-3 bg-[var(--input-color)] rounded-lg mb-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.username}</p>
              {user?.email && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">{user.email}</p>
              )}
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={handleSettings}
              className="rounded-lg px-3 py-2.5 hover:bg-[var(--hover-color)] focus:bg-[var(--hover-color)] transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-3 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 hover:bg-[var(--hover-color)] focus:bg-[var(--hover-color)] transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3 text-[var(--text-secondary)]" />
              <span className="font-medium text-[var(--text-primary)]">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
