const { get } = require('../../utils/api')
const { stripHtml, formatDate } = require('../../utils/format')

Page({
  data: {
    sport: null,
    investment: null,
    loading: true,
    maxSportTypeCount: 1,
  },

  onLoad() { this.loadInsights() },
  onPullDownRefresh() {
    this.loadInsights().then(() => wx.stopPullDownRefresh())
  },

  async loadInsights() {
    this.setData({ loading: true })
    try {
      const res = await get('/thoughts/insights')
      const { sport, investment } = res.data
      const maxSportTypeCount = Math.max(...(sport?.byType?.map(i => i.count) ?? [0]), 1)
      const maxSportMonthly = Math.max(...(sport?.monthly?.map(i => i.count) ?? [0]), 1)
      const maxInvestMonthly = Math.max(...(investment?.monthly?.map(i => i.count) ?? [0]), 1)

      const sportMonthly = (sport?.monthly || []).map(m => ({
        ...m,
        heightPct: Math.max((m.count / maxSportMonthly) * 100, m.count > 0 ? 8 : 0),
      }))
      const investMonthly = (investment?.monthly || []).map(m => ({
        ...m,
        heightPct: Math.max((m.count / maxInvestMonthly) * 100, m.count > 0 ? 8 : 0),
      }))
      const byType = (sport?.byType || []).map(t => ({
        ...t,
        widthPct: (t.count / maxSportTypeCount) * 100,
      }))

      const sportRecent = (sport?.recent || []).map(r => ({
        ...r,
        contentText: stripHtml(r.content),
        createdAtRelative: formatDate(r.createdAt, { relative: true }),
      }))
      const investRecent = (investment?.recent || []).map(r => ({
        ...r,
        contentText: stripHtml(r.content),
        createdAtRelative: formatDate(r.createdAt, { relative: true }),
      }))

      this.setData({
        sport: { ...sport, monthly: sportMonthly, byType, recent: sportRecent },
        investment: { ...investment, monthly: investMonthly, recent: investRecent },
        maxSportTypeCount,
        loading: false,
      })
    } catch (e) {
      console.error(e)
      this.setData({ loading: false })
    }
  },
})
