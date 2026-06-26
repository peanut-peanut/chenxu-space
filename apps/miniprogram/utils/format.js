function formatDate(dateStr, opts = {}) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (opts.relative) {
    const min = Math.floor(diff / 60000)
    const hour = Math.floor(diff / 3600000)
    const day = Math.floor(diff / 86400000)
    if (min < 1) return '刚刚'
    if (min < 60) return `${min}分钟前`
    if (hour < 24) return `${hour}小时前`
    if (day < 7) return `${day}天前`
  }

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  if (y === now.getFullYear()) return `${m}-${d}`
  return `${y}-${m}-${d}`
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function catAge(birthday) {
  const birth = new Date(`${birthday}T00:00:00`)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 12) return `${Math.max(months, 0)}个月`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest > 0 ? `${years}岁${rest}个月` : `${years}岁`
}

function ossImageUrl(url, width) {
  if (!url || !url.includes('.aliyuncs.com/') || url.includes('x-oss-process=')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}x-oss-process=image/resize,w_${width}/quality,q_82/format,webp`
}

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
}

module.exports = { formatDate, formatFileSize, catAge, ossImageUrl, stripHtml }
