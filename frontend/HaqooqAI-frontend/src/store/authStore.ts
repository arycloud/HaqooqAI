import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, QuotaInfo } from '@/types/auth'

interface AuthState {
  user: User | null
  quota: QuotaInfo | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setQuota: (quota: QuotaInfo | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateUser: (updates: Partial<User>) => void
  updateQuota: (updates: Partial<QuotaInfo>) => void
  reset: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  quota: null,
  loading: false,
  error: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      setQuota: (quota) =>
        set({ quota }),

      setLoading: (loading) =>
        set({ loading }),

      setError: (error) =>
        set({ error }),

      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          const updatedUser = { ...user, ...updates }
          set({
            user: updatedUser,
            isAuthenticated: true,
          })
        }
      },

      updateQuota: (updates) => {
        const { quota } = get()
        if (quota) {
          const updatedQuota = { ...quota, ...updates }
          set({ quota: updatedQuota })
        }
      },

      reset: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: 'haqooqai-auth',
      partialize: (state) => ({
        user: state.user,
        quota: state.quota,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
