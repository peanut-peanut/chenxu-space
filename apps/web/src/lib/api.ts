import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
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
      if (payload.code === 429) {
        message.error('操作太频繁，请稍后再试')
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

    const status = error.response?.status
    if (status === 429) {
      message.error('操作太频繁，请稍后再试')
    } else if (!error.response) {
      message.error('网络连接失败，请检查网络')
    }

    return Promise.reject(error.response?.data ?? error)
  }
)
