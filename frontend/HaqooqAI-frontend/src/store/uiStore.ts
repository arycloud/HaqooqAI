import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  compactMode: boolean
  showWelcomeMessage: boolean
}

interface UIActions {
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setCompactMode: (compact: boolean) => void
  toggleCompactMode: () => void
  setShowWelcomeMessage: (show: boolean) => void
  reset: () => void
}

type UIStore = UIState & UIActions

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  compactMode: false,
  showWelcomeMessage: true,
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSidebarOpen: (sidebarOpen) =>
        set({ sidebarOpen }),

      toggleSidebar: () => {
        const { sidebarOpen } = get()
        set({ sidebarOpen: !sidebarOpen })
      },

      setTheme: (theme) =>
        set({ theme }),

      toggleTheme: () => {
        const { theme } = get()
        set({ theme: theme === 'light' ? 'dark' : 'light' })
      },

      setCompactMode: (compactMode) =>
        set({ compactMode }),

      toggleCompactMode: () => {
        const { compactMode } = get()
        set({ compactMode: !compactMode })
      },

      setShowWelcomeMessage: (showWelcomeMessage) =>
        set({ showWelcomeMessage }),

      reset: () =>
        set({ ...initialState }),
    }),
    {
      name: 'haqooqai-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        compactMode: state.compactMode,
        showWelcomeMessage: state.showWelcomeMessage,
      }),
    }
  )
)

// Selectors
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useTheme = () => useUIStore((state) => state.theme)
export const useCompactMode = () => useUIStore((state) => state.compactMode)
export const useShowWelcomeMessage = () => useUIStore((state) => state.showWelcomeMessage)
