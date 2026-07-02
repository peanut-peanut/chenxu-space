const BASE_URL = 'http://localhost:3000/api'

let isRefreshing = false
let pendingQueue = []

function flushQueue(success) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (success) {
      resolve(request(config))
    } else {
      reject(new Error('登录已过期'))
    }
  })
  pendingQueue = []
}

function refreshToken() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      withCredentials: true,
      success: (res) => {
        if (res.data?.code === 200) resolve(res.data)
        else reject(res.data)
      },
      fail: reject,
    })
  })
}

function logout() {
  wx.request({ url: `${BASE_URL}/auth/logout`, method: 'POST', withCredentials: true })
  const app = getApp()
  app.clearUser()
  wx.reLaunch({ url: '/pages/login/login' })
}

function request(config) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'content-type': 'application/json',
        ...(config.header || {}),
      },
      withCredentials: true,
      success: async (res) => {
        const payload = res.data
        const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].includes(config.url)

        if (payload?.code && payload.code !== 200) {
          if (payload.code === 401 && !config._retry && !isAuthEndpoint) {
            if (isRefreshing) {
              pendingQueue.push({ resolve, reject, config: { ...config, _retry: true } })
              return
            }
            isRefreshing = true
            try {
              await refreshToken()
              isRefreshing = false
              flushQueue(true)
              resolve(request({ ...config, _retry: true }))
            } catch {
              isRefreshing = false
              flushQueue(false)
              logout()
              reject(payload)
            }
            return
          }

          if (payload.code === 429) {
            wx.showToast({ title: '操作太频繁，请稍后再试', icon: 'none' })
          }

          reject(payload)
          return
        }

        resolve(payload)
      },
      fail: (err) => {
        wx.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

function get(url, data) {
  return request({ url, method: 'GET', data })
}

function post(url, data) {
  return request({ url, method: 'POST', data })
}

function patch(url, data) {
  return request({ url, method: 'PATCH', data })
}

function del(url) {
  return request({ url, method: 'DELETE' })
}

module.exports = { request, get, post, patch, del }
