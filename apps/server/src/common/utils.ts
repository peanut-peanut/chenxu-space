export function estimateReadingTime(content: string): number {
  const words = content.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').length;
  return Math.max(1, Math.ceil(words / 400));
}
