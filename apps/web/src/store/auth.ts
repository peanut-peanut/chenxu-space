import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '@chenxu/types'

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  logout: () => Promise<void>
  isAdmin: () => boolean
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      logout: async () => {
        try {
          await axios.post('/api/auth/logout', null, { withCredentials: true })
        } catch {
          // ignore — clear local state regardless
        }
        set({ user: null })
      },
      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().user,
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user }) }
  )
)
