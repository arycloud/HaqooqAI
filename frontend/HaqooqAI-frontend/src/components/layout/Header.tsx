import { Menu, Settings, LogOut, User } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QuotaDisplay } from '@/components/settings/QuotaDisplay'

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
    <header className="h-20 lg:h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between px-8 lg:px-12 relative z-20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Left side with larger elements */}
      <div className="flex items-center relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="mr-4 w-12 h-12 lg:w-14 lg:h-14 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 rounded-xl"
        >
          <Menu className="w-6 h-6 lg:w-7 lg:h-7" />
        </Button>

        {!sidebarOpen && (
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold hidden md:block">
            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg lg:text-xl">H</span>
            </div>
            </Link>
            <Link to="/" className="text-xl font-bold hidden md:block">
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              HaqooqAI
            </h1>
            </Link>
          </div>
        )}
      </div>

      {/* Right side with larger elements */}
      <div className="flex items-center space-x-6 relative z-10">
        {/* Enhanced Quota Display */}
        <div className="hidden sm:block">
          <QuotaDisplay />
        </div>

        {/* Enhanced User Menu with larger elements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-4 px-4 py-3 lg:px-5 lg:py-4 rounded-2xl hover:bg-gray-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 group"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-11 h-11 lg:w-12 lg:h-12 rounded-full ring-2 ring-gray-200 dark:ring-slate-700 group-hover:ring-purple-300 dark:group-hover:ring-purple-600 transition-all duration-200"
                />
              ) : (
                <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-gray-200 dark:ring-slate-700 group-hover:ring-purple-300 dark:group-hover:ring-purple-600 transition-all duration-200">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              )}
              <span className="hidden md:block text-base lg:text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                {user?.username}
              </span>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            align="end"
            className="w-64 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl rounded-xl"
          >
            <div className="px-3 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
              {user?.email && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              )}
            </div>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={handleSettings}
              className="rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-500" />
              <span className="font-medium">Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="font-medium">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
