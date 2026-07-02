const { post } = require('../../utils/api')
const { formatDate } = require('../../utils/format')

Page({
  data: {
    user: null,
    accountSub: '',
    avatarLetter: '?',
    stats: { likes: 0, favorites: 0, footprint: 0 },
  },

  onShow() {
    const app = getApp()
    const user = app.globalData.user
    this.setData({
      user,
      avatarLetter: user && user.nickname ? user.nickname.charAt(0) : '?',
      accountSub: user
        ? `${user.role === 'admin' ? '管理员' : '普通用户'}${user.createdAt ? ` · 加入于 ${formatDate(user.createdAt)}` : ''}`
        : '',
    })
  },

  async onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '退出',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await post('/auth/logout')
        } catch (e) {
          // ignore
        }
        const app = getApp()
        app.clearUser()
        this.setData({ user: null, accountSub: '' })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onHeroTap() {
    if (!this.data.user) this.onGoLogin()
  },

  onStat() {
    if (!this.data.user) {
      this.onHeroTap()
      return
    }
    wx.showToast({ title: '功能建设中', icon: 'none' })
  },

  onAbout() {
    wx.showToast({ title: '功能建设中', icon: 'none' })
  },

  onRequireLoginFeature(e) {
    if (this.data.user) {
      wx.showToast({ title: '功能建设中', icon: 'none' })
      return
    }
    const feature = e.currentTarget.dataset.feature || '该功能'
    wx.showModal({
      title: '先登录再查看',
      content: `${feature}需要登录后使用`,
      confirmText: '去登录',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) this.onGoLogin()
      },
    })
  },

  onGoCats() {
    wx.switchTab({ url: '/pages/cats/cats' })
  },

  onGoInsights() {
    wx.switchTab({ url: '/pages/insights/insights' })
  },
})
