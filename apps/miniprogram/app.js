const { request, refreshToken } = require('./utils/api')

App({
  globalData: {
    user: null,
    baseUrl: 'https://peanutwcx.xyz/api',
  },

  onLaunch() {
    const user = wx.getStorageSync('user')
    if (user) this.globalData.user = user
  },

  setUser(user) {
    this.globalData.user = user
    wx.setStorageSync('user', user)
  },

  clearUser() {
    this.globalData.user = null
    wx.removeStorageSync('user')
  },

  isLoggedIn() {
    return !!this.globalData.user
  },

  isAdmin() {
    return this.globalData.user?.role === 'admin'
  },

  requireLogin() {
    if (!this.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' })
      return false
    }
    return true
  },
})
