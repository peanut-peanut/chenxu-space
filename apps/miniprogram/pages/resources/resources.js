const { get, del } = require('../../utils/api')
const { formatFileSize } = require('../../utils/format')

Page({
  data: {
    breadcrumb: [],
    currentFolderId: null,
    folders: [],
    files: [],
    loading: false,
    isAdmin: false,
  },

  onLoad() {
    const app = getApp()
    this.setData({ isAdmin: app.isAdmin() })
    this.loadRoot()
  },

  onPullDownRefresh() {
    const { currentFolderId } = this.data
    const p = currentFolderId ? this.loadFolder(currentFolderId) : this.loadRoot()
    p.then(() => wx.stopPullDownRefresh())
  },

  async loadRoot() {
    this.setData({ loading: true })
    try {
      const res = await get('/folders')
      this.setData({ folders: res.data || [], files: [], breadcrumb: [], currentFolderId: null })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadFolder(id) {
    this.setData({ loading: true })
    try {
      const res = await get(`/folders/${id}`)
      const files = (res.data.files || []).map(f => ({
        ...f,
        sizeLabel: formatFileSize(f.size),
        icon: f.type === 'image' ? '🖼' : f.type === 'video' ? '🎬' : '📄',
      }))
      this.setData({ folders: res.data.subfolders || [], files })
    } catch (e) {
      console.error(e)
    } finally {
      this.setData({ loading: false })
    }
  },

  onOpenFolder(e) {
    const folder = e.currentTarget.dataset.folder
    const breadcrumb = [...this.data.breadcrumb, { id: folder.id, name: folder.name }]
    this.setData({ breadcrumb, currentFolderId: folder.id })
    this.loadFolder(folder.id)
  },

  onNavBreadcrumb(e) {
    const index = e.currentTarget.dataset.index
    if (index === -1) {
      this.setData({ breadcrumb: [], currentFolderId: null })
      this.loadRoot()
    } else {
      const breadcrumb = this.data.breadcrumb.slice(0, index + 1)
      const folderId = breadcrumb[breadcrumb.length - 1].id
      this.setData({ breadcrumb, currentFolderId: folderId })
      this.loadFolder(folderId)
    }
  },

  onOpenFile(e) {
    const { file } = e.currentTarget.dataset
    if (file.type === 'image') {
      const allImages = this.data.files.filter(f => f.type === 'image').map(f => f.url)
      wx.previewImage({ urls: allImages, current: file.url })
    } else if (file.type === 'video') {
      wx.navigateTo({ url: `/pages/resources/video?url=${encodeURIComponent(file.url)}` })
    } else {
      wx.showModal({
        title: file.name,
        content: '是否在浏览器中打开此文件？',
        confirmText: '打开',
        success: (res) => {
          if (res.confirm) wx.setClipboardData({ data: file.url })
        },
      })
    }
  },
})
