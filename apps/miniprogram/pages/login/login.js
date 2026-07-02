const { post } = require('../../utils/api')

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    error: '',
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value, error: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, error: '' })
  },

  async onSubmit() {
    const { phone, password, loading } = this.data
    if (loading) return
    if (!phone.trim() || !password.trim()) {
      const message = '请填写手机号和密码'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
      return
    }

    this.setData({ loading: true, error: '' })
    try {
      const res = await post('/auth/login', { phone: phone.trim(), password })
      const app = getApp()
      app.setUser(res.data)
      wx.switchTab({ url: '/pages/daily/daily' })
    } catch (err) {
      const message = err?.message || '手机号或密码错误'
      this.setData({ error: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
