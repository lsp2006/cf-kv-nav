import type { Category, Link, SiteSettings, Submission } from '../types'
import { DEFAULT_SETTINGS } from '../data/seed'

// KV 键名
export const KEYS = {
  categories: 'categories',
  links: 'links',
  settings: 'settings',
  submissions: 'submissions',
} as const

// ---------- 分类 ----------
export async function getCategories(kv: KVNamespace): Promise<Category[]> {
  return (await kv.get<Category[]>(KEYS.categories, 'json')) ?? []
}
export async function putCategories(kv: KVNamespace, cats: Category[]): Promise<void> {
  await kv.put(KEYS.categories, JSON.stringify(cats))
}

// ---------- 链接 ----------
export async function getLinks(kv: KVNamespace): Promise<Link[]> {
  return (await kv.get<Link[]>(KEYS.links, 'json')) ?? []
}
export async function putLinks(kv: KVNamespace, links: Link[]): Promise<void> {
  await kv.put(KEYS.links, JSON.stringify(links))
}

// ---------- 设置 ----------
export async function getSettings(kv: KVNamespace): Promise<SiteSettings> {
  const s = await kv.get<SiteSettings>(KEYS.settings, 'json')
  // 合并默认值，防止后续新增字段缺失
  const merged: SiteSettings = { ...DEFAULT_SETTINGS, ...(s ?? {}) }
  // 兼容旧 schema：useBingBackground -> bgMode
  if (!s?.bgMode && s?.useBingBackground) {
    merged.bgMode = 'bing'
  }
  return merged
}
export async function putSettings(kv: KVNamespace, s: SiteSettings): Promise<void> {
  await kv.put(KEYS.settings, JSON.stringify(s))
}

// ---------- 提交 ----------
export async function getSubmissions(kv: KVNamespace): Promise<Submission[]> {
  return (await kv.get<Submission[]>(KEYS.submissions, 'json')) ?? []
}
export async function putSubmissions(kv: KVNamespace, subs: Submission[]): Promise<void> {
  await kv.put(KEYS.submissions, JSON.stringify(subs))
}
