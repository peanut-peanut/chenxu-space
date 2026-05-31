import axios from 'axios'
import { useAuthStore } from '@/store/auth'

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config
    const url: string = original?.url ?? ''
    const isAuthEndpoint = url.startsWith('/auth/refresh') || url.startsWith('/auth/logout') || url.startsWith('/auth/login')

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        await axios.post('/api/auth/refresh', null, { withCredentials: true })
        return api(original)
      } catch {
        await axios.post('/api/auth/logout', null, { withCredentials: true }).catch(() => {})
        useAuthStore.getState().clearUser()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error.response?.data ?? error)
  }
)
