/** Shared between the service worker and the page. No DOM or worker types here. */

export const SAVED_CACHE = 'rh-saved-articles-v1'
export const SAVED_INDEX = '/__offline/saved.json'
export const OFFLINE_PATH = '/offline'

export type SavedArticle = { url: string; title: string }

export type SwMessage = { type: 'SYNC_SAVED'; articles: SavedArticle[] } | { type: 'CLEAR_SAVED' }

/** Element on the offline page the service worker fills with the saved-article list. */
export const OFFLINE_SLOT_ID = 'rh-offline-saved'

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/** Markup for the offline page's saved list (plain HTML: it must work without JavaScript). */
export function savedListHtml(articles: SavedArticle[]): string {
  if (!articles.length) {
    return '<p class="t-small t-muted" style="margin-top:8px">এখনো কোনো লেখা সংরক্ষিত নেই। অনলাইনে থাকার সময় লেখার পাশে বুকমার্ক চাপলে সেটি এখানে অফলাইনে পড়া যাবে।</p>'
  }
  const items = articles
    .filter((a) => a.url.startsWith('/ilm/'))
    .map(
      (a) =>
        `<li><a class="cat-link" href="${escapeHtml(a.url)}"><span style="flex:1">${escapeHtml(a.title || a.url)}</span></a></li>`,
    )
    .join('')
  return `<ul style="list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column">${items}</ul>`
}
