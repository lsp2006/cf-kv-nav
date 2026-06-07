import type { Category, Link, SiteSettings } from '../types'
import { nanoid } from '../lib/id'

// 默认站点设置
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Node Nav',
  siteTitle: 'Node Nav · 个人书签导航',
  siteDescription: '极简、现代、移动友好的个人书签导航站',
  siteKeywords: 'nav,bookmarks,导航,书签',
  logoText: '⚡ Node Nav',
  theme: 'auto',
  cardSize: 'normal',
  showSidebar: true,
  footerHtml: 'Powered by Hono · Cloudflare Workers',
  searchEngines: [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search', queryParam: 'q' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search', queryParam: 'q' },
    { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s', queryParam: 'wd' },
  ],
  submissionEnabled: false,
  bgMode: 'off',
  bgBingPicks: [],
  bgOpacity: 1.0,
  useGlassEffect: true,
  glassOpacity: 0.6,
}

// 紧凑的种子数据：[name, url] 元组，运行时转换为完整 Link
type RawLink = [string, string]

export const SEED_RAW: Record<string, RawLink[]> = {
  常用: [
    ['Gmail', 'https://mail.google.com'],
    ['翻译', 'https://translate.google.com/?sl=auto&tl=zh-CN&op=translate'],
    ['地图', 'https://maps.google.com'],
    ['Gemini', 'https://gemini.google.com/app?hl=zh'],
    ['YouTube', 'https://youtube.com'],
    ['GitHub', 'https://github.com'],
    ['Cloudflare', 'https://dash.cloudflare.com'],
    ['ChatGPT', 'https://chat.openai.com'],
    ['NodeSeek', 'https://www.nodeseek.com'],
    ['Linux do', 'https://linux.do'],
  ],
  工具: [
    ['JSON 工具', 'https://www.json.cn'],
    ['Base64 工具', 'https://www.qqxiuzi.cn/bianma/base64.htm'],
    ['二维码生成', 'https://cli.im'],
    ['Remove.photos', 'https://remove.photos/zh-cn'],
  ],
  服务: [
    ['阿里云', 'https://www.aliyun.com'],
    ['腾讯云', 'https://cloud.tencent.com'],
    ['甲骨文云', 'https://cloud.oracle.com'],
    ['亚马逊云', 'https://aws.amazon.com'],
  ],
  智能: [
    ['ChatGPT', 'https://chat.openai.com'],
    ['Gemini', 'https://gemini.google.com'],
    ['Claude', 'https://claude.ai'],
    ['Perplexity', 'https://www.perplexity.ai'],
    ['Deepseek', 'https://www.deepseek.com'],
    ['Kimi', 'https://www.kimi.com'],
  ],
  邮箱: [
    ['Gmail', 'https://mail.google.com'],
    ['Outlook', 'https://outlook.live.com'],
    ['QQ 邮箱', 'https://mail.qq.com'],
    ['Proton Mail', 'https://account.proton.me'],
    ['临时邮箱', 'https://temp-mail.org/'],
  ],
}

function faviconFor(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return ''
  }
}

// 用种子数据构造初始 categories + links
export function buildSeedData() {
  const now = Date.now()
  const categories: Category[] = []
  const links: Link[] = []
  let catIdx = 0
  for (const [catName, raws] of Object.entries(SEED_RAW)) {
    const catId = nanoid()
    categories.push({
      id: catId,
      name: catName,
      parentId: null,
      sort: (catIdx + 1) * 10,
      visible: true,
      createdAt: now,
    })
    raws.forEach(([title, url], i) => {
      links.push({
        id: nanoid(),
        categoryId: catId,
        title,
        url,
        icon: faviconFor(url),
        sort: (i + 1) * 10,
        newTab: true,
        status: 'active' as const,
        source: 'admin' as const,
        createdAt: now,
      })
    })
    catIdx++
  }
  return { categories, links, settings: DEFAULT_SETTINGS }
}
