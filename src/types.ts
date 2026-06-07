// Cloudflare Workers / Hono bindings
export type Bindings = {
  NODE_NAV_KV: KVNamespace
  ASSETS: Fetcher
  ADMIN_PASSWORD: string
}

// ---------- 数据模型 ----------

// 分类节点（扁平存储，通过 parentId 串成树）
export interface Category {
  id: string
  name: string
  icon?: string            // emoji 或 URL
  parentId: string | null  // null = 顶层
  sort: number             // 同级排序，越小越靠前
  visible: boolean         // 前台是否显示
  createdAt: number
}

// 链接
export interface Link {
  id: string
  categoryId: string
  title: string
  url: string
  icon: string             // 图标 URL（自动从 favicon API 推导）
  description?: string
  sort: number
  newTab: boolean
  status: 'active' | 'pending' | 'broken'
  source: 'admin' | 'user'
  lastChecked?: number
  createdAt: number
}

// 用户提交（待审核）
export interface Submission {
  id: string
  title: string
  url: string
  suggestedCategoryId?: string
  reason?: string
  submitter?: string
  submittedAt: number
}

// 搜索引擎
export interface SearchEngine {
  id: string
  name: string
  url: string
  queryParam: string
  icon?: string
}

// 站点全局设置
export interface SiteSettings {
  siteName: string
  siteTitle: string
  siteDescription: string
  siteKeywords: string
  logoText: string
  logoUrl?: string
  theme: 'auto' | 'light' | 'dark' | 'cupcake' | 'corporate' | 'business' | 'synthwave' | 'emerald'
  cardSize: 'compact' | 'normal' | 'large'
  showSidebar: boolean
  footerHtml: string
  searchEngines: SearchEngine[]
  submissionEnabled: boolean
  // 视觉增强 —— 背景三选一
  bgMode: 'off' | 'bing' | 'custom'
  bgBingPicks: number[]      // 选中的 Bing 图索引 [0-7]，空数组 = 全部 8 张随机
  bgCustomUrl?: string       // 自定义图片 URL
  bgOpacity: number          // 背景图不透明度 0.1 - 1.0（越小越淡，更易读）
  // 毛玻璃
  useGlassEffect: boolean
  glassOpacity: number       // 0.1 - 0.9
  // 已弃用（保留兼容旧 KV）
  useBingBackground?: boolean
}
