import type { Category, Link, SiteSettings } from '../types'
import { nanoid } from './id'
import { DEFAULT_SETTINGS, buildSeedData } from '../data/seed'
import { KEYS } from './kv'

const LEGACY_KEY = 'bookmarks'

function faviconFor(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return ''
  }
}

// 把旧的 { 分类名: [{name,url,icon}] } 结构转换为新 schema
async function migrateLegacy(kv: KVNamespace, legacy: any): Promise<void> {
  const now = Date.now()
  const categories: Category[] = []
  const links: Link[] = []

  Object.entries(legacy).forEach(([catName, value], catIdx) => {
    if (catName === 'settings') return
    if (!Array.isArray(value)) return
    const catId = nanoid()
    categories.push({
      id: catId,
      name: catName,
      parentId: null,
      sort: (catIdx + 1) * 10,
      visible: true,
      createdAt: now,
    })
    ;(value as any[]).forEach((bm: any, linkIdx) => {
      if (!bm?.name || !bm?.url) return
      links.push({
        id: nanoid(),
        categoryId: catId,
        title: bm.name,
        url: bm.url,
        icon: bm.icon || faviconFor(bm.url),
        sort: (linkIdx + 1) * 10,
        newTab: true,
        status: 'active',
        source: 'admin',
        createdAt: now,
      })
    })
  })

  // 转换旧 settings
  const legacySettings = legacy.settings ?? {}
  const settings: SiteSettings = {
    ...DEFAULT_SETTINGS,
    siteTitle: legacySettings.siteTitle || DEFAULT_SETTINGS.siteTitle,
    theme:
      legacySettings.theme === 'dark' || legacySettings.theme === 'light'
        ? legacySettings.theme
        : 'auto',
    searchEngines:
      Array.isArray(legacySettings.engineConfig) && legacySettings.engineConfig.length > 0
        ? legacySettings.engineConfig.map((e: any) => ({
            id: e.id || nanoid(),
            name: e.name || 'Search',
            url: e.url,
            queryParam: e.queryParam || 'q',
          }))
        : DEFAULT_SETTINGS.searchEngines,
  }

  await kv.put(KEYS.categories, JSON.stringify(categories))
  await kv.put(KEYS.links, JSON.stringify(links))
  await kv.put(KEYS.settings, JSON.stringify(settings))
  await kv.delete(LEGACY_KEY)
}

async function seed(kv: KVNamespace): Promise<void> {
  const { categories, links, settings } = buildSeedData()
  await kv.put(KEYS.categories, JSON.stringify(categories))
  await kv.put(KEYS.links, JSON.stringify(links))
  await kv.put(KEYS.settings, JSON.stringify(settings))
}

/**
 * 幂等的初始化：
 *   1. 若已存在 categories，直接返回（热路径，仅 1 次 KV 读取）。
 *   2. 否则检查旧 bookmarks key，存在则迁移。
 *   3. 都没有则用默认种子数据初始化。
 */
export async function ensureInitialized(kv: KVNamespace): Promise<void> {
  const exists = await kv.get(KEYS.categories)
  if (exists) return
  const legacy = await kv.get<any>(LEGACY_KEY, 'json')
  if (legacy && typeof legacy === 'object') {
    await migrateLegacy(kv, legacy)
    return
  }
  await seed(kv)
}
