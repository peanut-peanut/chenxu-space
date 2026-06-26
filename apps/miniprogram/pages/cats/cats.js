const { get } = require('../../utils/api')
const { catAge, ossImageUrl, formatDate } = require('../../utils/format')

Page({
  data: {
    cats: [],
    media: [],
    selectedCats: [],   // 多选，空数组=全部
    mediaFilter: 'all',
    loading: false,
    catsLoading: true,
    page: 1,
    hasMore: true,
    loadingMore: false,
  },

  onLoad() {
    this.loadCats()
    this.loadMedia(true)
  },

  onPullDownRefresh() {
    Promise.all([this.loadCats(), this.loadMedia(true)])
      .then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) this.loadMoreMedia()
  },

  async loadCats() {
    this.setData({ catsLoading: true })
    try {
      const res = await get('/cats')
      const cats = (res.data || []).map(c => ({ ...c, age: catAge(c.birthday) }))
      // 默认全部选中
      const selectedCats = cats.map(c => c.id)
      this.setData({ cats, selectedCats })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ catsLoading: false })
    }
  },

  async loadMedia(reset = false) {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const { selectedCats, mediaFilter, cats } = this.data
      const allSelected = selectedCats.length === cats.length
      const params = new URLSearchParams({ page: '1', pageSize: '30' })
      if (!allSelected && selectedCats.length === 1) params.set('cat', selectedCats[0])
      if (mediaFilter !== 'all') params.set('type', mediaFilter)
      const res = await get(`/cats/media?${params.toString()}`)
      const items = (res.data.data || []).map(m => ({
        ...m,
        thumbUrl: m.type === 'image' ? ossImageUrl(m.url, 400) : m.url,
        dateLabel: m.shotAt ? formatDate(m.shotAt) : '',
      }))
      const meta = res.data.meta
      this.setData({ media: items, page: 1, hasMore: meta.page < meta.totalPages })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadMoreMedia() {
    this.setData({ loadingMore: true })
    try {
      const { selectedCats, mediaFilter, page, media, cats } = this.data
      const allSelected = selectedCats.length === cats.length
      const nextPage = page + 1
      const params = new URLSearchParams({ page: String(nextPage), pageSize: '30' })
      if (!allSelected && selectedCats.length === 1) params.set('cat', selectedCats[0])
      if (mediaFilter !== 'all') params.set('type', mediaFilter)
      const res = await get(`/cats/media?${params.toString()}`)
      const items = (res.data.data || []).map(m => ({
        ...m,
        thumbUrl: m.type === 'image' ? ossImageUrl(m.url, 400) : m.url,
        dateLabel: m.shotAt ? formatDate(m.shotAt) : '',
      }))
      const meta = res.data.meta
      this.setData({ media: [...media, ...items], page: nextPage, hasMore: meta.page < meta.totalPages })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  onCatFilter(e) {
    const value = e.currentTarget.dataset.value
    const { selectedCats, cats } = this.data
    let next
    if (selectedCats.includes(value)) {
      // 至少保留一只
      if (selectedCats.length === 1) return
      next = selectedCats.filter(id => id !== value)
    } else {
      next = [...selectedCats, value]
    }
    this.setData({ selectedCats: next, media: [], page: 1, hasMore: true })
    this.loadMedia(true)
  },

  onMediaFilter(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.mediaFilter) return
    this.setData({ mediaFilter: value, media: [], page: 1, hasMore: true })
    this.loadMedia(true)
  },

  onPreview(e) {
    const { url, type } = e.currentTarget.dataset
    if (type === 'image') {
      const urls = this.data.media.filter(m => m.type === 'image').map(m => m.url)
      wx.previewImage({ urls, current: url })
    } else {
      wx.navigateTo({ url: `/pages/cats/video?url=${encodeURIComponent(url)}` })
    }
  },
})
