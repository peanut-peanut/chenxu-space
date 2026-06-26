const { post } = require('../../utils/api')
const { formatDate } = require('../../utils/format')

Page({
  data: {
    user: null,
    joinedAt: '',
  },

  onShow() {
    const app = getApp()
    const user = app.globalData.user
    this.setData({
      user,
      joinedAt: user ? formatDate(user.createdAt) : '',
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
        this.setData({ user: null })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      },
    })
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },
})
