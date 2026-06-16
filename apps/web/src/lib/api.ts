import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true,
})

api.interceptors.response.use(
  async (res) => {
    const payload = res.data
    const original = res.config as RetryableRequestConfig
    const url: string = original?.url ?? ''
    const isAuthEndpoint = url.startsWith('/auth/refresh') || url.startsWith('/auth/logout') || url.startsWith('/auth/login')

    if (payload?.code && payload.code !== 200) {
      if (payload.code === 401 && !original._retry && !isAuthEndpoint) {
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
      return Promise.reject(payload)
    }

    return payload
  },
  async (error) => {
    const original = error.config as RetryableRequestConfig
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
