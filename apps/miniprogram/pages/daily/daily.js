const { get, post } = require('../../utils/api')
const { formatDate, ossImageUrl, stripHtml } = require('../../utils/format')

const PAGE_SIZE = 20

const TYPE_TABS = [
  { value: 'all', label: '全部', activeClass: 'tab-all' },
  { value: 'daily', label: '日常', activeClass: 'tab-daily' },
  { value: 'sport', label: '运动', activeClass: 'tab-sport' },
  { value: 'diet', label: '饮食', activeClass: 'tab-diet' },
  { value: 'investment', label: '投资', activeClass: 'tab-investment' },
  { value: 'literature', label: '文献', activeClass: 'tab-literature' },
  { value: 'idea', label: '想法', activeClass: 'tab-idea' },
]

const TYPE_LABELS = {
  daily: '日常', sport: '运动', diet: '饮食',
  investment: '投资', literature: '文献', idea: '想法',
}

const SPORT_TYPE_LABELS = { basketball: '篮球', fitness: '健身', swimming: '游泳' }

function transformThought(t) {
  return {
    ...t,
    typeLabel: TYPE_LABELS[t.type] || t.type,
    contentText: stripHtml(t.content),
    createdAtRelative: formatDate(t.createdAt, { relative: true }),
    sportTypeLabel: t.sportType ? SPORT_TYPE_LABELS[t.sportType] : '',
    hasSportMeta: !!(t.sportType || t.sportDuration || t.sportCalories),
    images: (t.images || []).map(url => ossImageUrl(url, 600)),
  }
}

Page({
  data: {
    typeTabs: TYPE_TABS,
    selectedType: 'all',
    thoughts: [],
    loading: false,
    loadingMore: false,
    hasMore: true,
    page: 1,
  },

  onLoad() {
    this.fetchThoughts(true)
  },

  onPullDownRefresh() {
    this.fetchThoughts(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.fetchMoreThoughts()
    }
  },

  onSelectType(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.selectedType) return
    this.setData({ selectedType: value, thoughts: [], page: 1, hasMore: true })
    this.fetchThoughts(true)
  },

  async fetchThoughts(reset = false) {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const { selectedType } = this.data
      const type = selectedType === 'all' ? '' : selectedType
      const res = await get(`/thoughts?page=1&pageSize=${PAGE_SIZE}${type ? `&type=${type}` : ''}`)
      const items = (res.data.data || []).map(transformThought)
      const meta = res.data.meta
      this.setData({
        thoughts: items,
        page: 1,
        hasMore: meta.page < meta.totalPages,
      })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async fetchMoreThoughts() {
    if (this.data.loadingMore || !this.data.hasMore) return
    this.setData({ loadingMore: true })
    try {
      const { selectedType, page } = this.data
      const nextPage = page + 1
      const type = selectedType === 'all' ? '' : selectedType
      const res = await get(`/thoughts?page=${nextPage}&pageSize=${PAGE_SIZE}${type ? `&type=${type}` : ''}`)
      const items = (res.data.data || []).map(transformThought)
      const meta = res.data.meta
      this.setData({
        thoughts: [...this.data.thoughts, ...items],
        page: nextPage,
        hasMore: meta.page < meta.totalPages,
      })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  onLoadMore() {
    this.fetchMoreThoughts()
  },

  onOpenDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/daily/detail?id=${id}` })
  },

  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ urls, current })
  },

  onToggleLike(e) {
    const app = getApp()
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const { id, index } = e.currentTarget.dataset
    post(`/thoughts/${id}/like`).then(() => {
      const thoughts = [...this.data.thoughts]
      const t = thoughts[index]
      thoughts[index] = {
        ...t,
        liked: !t.liked,
        likesCount: t.liked ? t.likesCount - 1 : t.likesCount + 1,
      }
      this.setData({ thoughts })
    })
  },

  onToggleDislike(e) {
    const app = getApp()
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const { id, index } = e.currentTarget.dataset
    post(`/thoughts/${id}/dislike`).then(() => {
      const thoughts = [...this.data.thoughts]
      const t = thoughts[index]
      thoughts[index] = {
        ...t,
        disliked: !t.disliked,
        dislikesCount: t.disliked ? t.dislikesCount - 1 : t.dislikesCount + 1,
      }
      this.setData({ thoughts })
    })
  },
})
