import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Bindings, Category, Link } from '../types'
import {
  getCategories,
  putCategories,
  getLinks,
  putLinks,
  getSettings,
  putSettings,
  getSubmissions,
  putSubmissions,
} from '../lib/kv'
import {
  createSession,
  destroySession,
  verifySession,
  SESSION_COOKIE,
} from '../lib/auth'
import { nanoid } from '../lib/id'
import { ensureInitialized } from '../lib/migrate'
import { Home } from '../views/Home'
import { Login } from '../views/Login'
import { Admin } from '../views/Admin'
import { CategoryEdit } from '../views/CategoryEdit'
import { LinkEdit } from '../views/LinkEdit'
import { Settings } from '../views/Settings'
import { ImportExport } from '../views/ImportExport'
import { Submit } from '../views/Submit'
import { Pending } from '../views/Pending'
import { exportToNetscapeHTML, parseNetscapeHTML } from '../lib/bookmark-format'
import { getBingImages, pickRandom } from '../lib/bing'
import type { SiteSettings, Submission } from '../types'

export const pages = new Hono<{ Bindings: Bindings }>()

// ---------- 工具 ----------

async function isLoggedIn(c: any): Promise<boolean> {
  return verifySession(c.env.NODE_NAV_KV, getCookie(c, SESSION_COOKIE))
}

function faviconFor(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return ''
  }
}

function nextSort(arr: Array<{ sort: number }>): number {
  if (arr.length === 0) return 10
  return Math.max(...arr.map((x) => x.sort)) + 10
}

// 判断 candidate 是否是 root 的后代（用于防止把分类移到自己的子树里）
function isDescendant(
  cats: Category[],
  candidateId: string,
  rootId: string,
): boolean {
  let cur: Category | undefined = cats.find((c) => c.id === candidateId)
  while (cur && cur.parentId) {
    if (cur.parentId === rootId) return true
    cur = cats.find((c) => c.id === cur!.parentId)
  }
  return false
}

// ---------- 全局：首次初始化（幂等） ----------
pages.use('*', async (c, next) => {
  await ensureInitialized(c.env.NODE_NAV_KV)
  await next()
})

// ---------- 首页 ----------
pages.get('/', async (c) => {
  const [categories, links, settings, admin] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
    isLoggedIn(c),
  ])

  // 根据 bgMode 解析背景图
  let bgImageUrl: string | undefined
  let bgCopyright: string | undefined

  if (settings.bgMode === 'bing') {
    const imgs = await getBingImages(c.env.NODE_NAV_KV)
    if (imgs.length > 0) {
      // 根据用户勾选筛选（空 = 全部）
      const picks = (settings.bgBingPicks || []).filter((i) => i >= 0 && i < imgs.length)
      const pool = picks.length > 0 ? picks.map((i) => imgs[i]) : imgs
      const pick = pickRandom(pool)
      if (pick) {
        bgImageUrl = pick.url
        bgCopyright = pick.copyright
      }
    }
  } else if (settings.bgMode === 'custom' && settings.bgCustomUrl) {
    bgImageUrl = settings.bgCustomUrl
  }

  return c.html(
    <Home
      categories={categories}
      links={links}
      settings={settings}
      isAdmin={admin}
      bgImageUrl={bgImageUrl}
      bgCopyright={bgCopyright}
    />,
  )
})

// ---------- 登录 / 登出 ----------
pages.get('/login', async (c) => {
  if (await isLoggedIn(c)) return c.redirect('/admin')
  return c.html(<Login />)
})

pages.post('/login', async (c) => {
  const form = await c.req.parseBody()
  const password = String(form.password || '')
  if (password !== c.env.ADMIN_PASSWORD) {
    return c.html(<Login error="密码错误，请重试" />, 401)
  }
  const token = await createSession(c.env.NODE_NAV_KV)
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  })
  return c.redirect('/admin')
})

pages.post('/logout', async (c) => {
  await destroySession(c.env.NODE_NAV_KV, getCookie(c, SESSION_COOKIE))
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.redirect('/')
})

// ---------- 后台总闸门 ----------
pages.use('/admin/*', async (c, next) => {
  if (!(await isLoggedIn(c))) return c.redirect('/login')
  await next()
})
pages.use('/admin', async (c, next) => {
  if (!(await isLoggedIn(c))) return c.redirect('/login')
  await next()
})

// ---------- 后台主页 ----------
pages.get('/admin', async (c) => {
  const [categories, links, submissions, settings] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
    getSubmissions(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
  ])

  // 解析扫描结果（用于 banner 提示）
  let scanResult: any
  const s = c.req.query('scan')
  if (s === 'done') {
    const ok = parseInt(c.req.query('ok') || '0', 10)
    const broken = parseInt(c.req.query('broken') || '0', 10)
    const next = c.req.query('next')
    scanResult = {
      ok,
      broken,
      scanned: ok + broken,
      total: parseInt(c.req.query('total') || '0', 10),
      nextOffset: next ? parseInt(next, 10) : undefined,
    }
  }

  return c.html(
    <Admin
      categories={categories}
      links={links}
      pendingCount={submissions.length}
      glassEffect={settings.useGlassEffect}
      glassOpacity={settings.glassOpacity}
      scanResult={scanResult}
    />,
  )
})

// ---------- 分类：新建 ----------
pages.get('/admin/category/new', async (c) => {
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const parent = c.req.query('parent') || null
  return c.html(<CategoryEdit parentOptions={cats} defaultParentId={parent} />)
})

pages.post('/admin/category/new', async (c) => {
  const form = await c.req.parseBody()
  const name = String(form.name || '').trim()
  if (!name) return c.redirect('/admin/category/new')
  const parentId = String(form.parentId || '') || null
  const icon = String(form.icon || '').trim() || undefined
  const visible = !!form.visible

  const cats = await getCategories(c.env.NODE_NAV_KV)
  const siblings = cats.filter((c) => c.parentId === parentId)
  cats.push({
    id: nanoid(),
    name,
    icon,
    parentId,
    sort: nextSort(siblings),
    visible,
    createdAt: Date.now(),
  })
  await putCategories(c.env.NODE_NAV_KV, cats)
  return c.redirect('/admin')
})

// ---------- 分类：编辑 ----------
pages.get('/admin/category/:id/edit', async (c) => {
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const cat = cats.find((x) => x.id === c.req.param('id'))
  if (!cat) return c.redirect('/admin')
  return c.html(<CategoryEdit category={cat} parentOptions={cats} />)
})

pages.post('/admin/category/:id/edit', async (c) => {
  const id = c.req.param('id')
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const cat = cats.find((x) => x.id === id)
  if (!cat) return c.redirect('/admin')

  const form = await c.req.parseBody()
  const name = String(form.name || '').trim()
  if (!name) return c.redirect(`/admin/category/${id}/edit`)

  const newParentId = String(form.parentId || '') || null

  // 防止把分类移到自己的子树里（会形成环）
  if (newParentId && (newParentId === id || isDescendant(cats, newParentId, id))) {
    return c.html(
      <CategoryEdit
        category={cat}
        parentOptions={cats}
        error="不能把分类移动到它的子分类下面"
      />,
      400,
    )
  }

  // 若 parentId 变化，重新排到新父级末尾
  if (cat.parentId !== newParentId) {
    const newSiblings = cats.filter((c) => c.parentId === newParentId && c.id !== id)
    cat.sort = nextSort(newSiblings)
  }

  cat.name = name
  cat.icon = String(form.icon || '').trim() || undefined
  cat.parentId = newParentId
  cat.visible = !!form.visible

  await putCategories(c.env.NODE_NAV_KV, cats)
  return c.redirect('/admin')
})

// ---------- 分类：删除（级联） ----------
pages.post('/admin/category/:id/delete', async (c) => {
  const id = c.req.param('id')
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const links = await getLinks(c.env.NODE_NAV_KV)

  // 收集所有要删除的 id（自身 + 全部后代）
  const toDelete = new Set<string>([id])
  let changed = true
  while (changed) {
    changed = false
    for (const cc of cats) {
      if (cc.parentId && toDelete.has(cc.parentId) && !toDelete.has(cc.id)) {
        toDelete.add(cc.id)
        changed = true
      }
    }
  }

  await Promise.all([
    putCategories(c.env.NODE_NAV_KV, cats.filter((c) => !toDelete.has(c.id))),
    putLinks(c.env.NODE_NAV_KV, links.filter((l) => !toDelete.has(l.categoryId))),
  ])
  return c.redirect('/admin')
})

// ---------- 分类：切换显示 ----------
pages.post('/admin/category/:id/toggle-visible', async (c) => {
  const id = c.req.param('id')
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const cat = cats.find((c) => c.id === id)
  if (cat) {
    cat.visible = !cat.visible
    await putCategories(c.env.NODE_NAV_KV, cats)
  }
  return c.redirect('/admin')
})

// ---------- 分类：上下移 ----------
pages.post('/admin/category/:id/move/:dir', async (c) => {
  const id = c.req.param('id')
  const dir = c.req.param('dir') as 'up' | 'down'
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const cat = cats.find((c) => c.id === id)
  if (!cat) return c.redirect('/admin')
  const siblings = cats
    .filter((c) => c.parentId === cat.parentId)
    .sort((a, b) => a.sort - b.sort)
  const idx = siblings.findIndex((s) => s.id === id)
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return c.redirect('/admin')
  const tmp = siblings[idx].sort
  siblings[idx].sort = siblings[swapIdx].sort
  siblings[swapIdx].sort = tmp
  await putCategories(c.env.NODE_NAV_KV, cats)
  return c.redirect('/admin')
})

// ---------- 链接：新建 ----------
pages.get('/admin/link/new', async (c) => {
  const cats = await getCategories(c.env.NODE_NAV_KV)
  const defaultCategoryId = c.req.query('category') || undefined
  return c.html(<LinkEdit categories={cats} defaultCategoryId={defaultCategoryId} />)
})

pages.post('/admin/link/new', async (c) => {
  const form = await c.req.parseBody()
  const title = String(form.title || '').trim()
  const url = String(form.url || '').trim()
  const categoryId = String(form.categoryId || '')
  if (!title || !url || !categoryId) return c.redirect('/admin/link/new')
  try {
    new URL(url)
  } catch {
    return c.redirect('/admin/link/new')
  }
  const cats = await getCategories(c.env.NODE_NAV_KV)
  if (!cats.find((c) => c.id === categoryId)) return c.redirect('/admin/link/new')

  const links = await getLinks(c.env.NODE_NAV_KV)
  const siblings = links.filter((l) => l.categoryId === categoryId)
  const iconInput = String(form.icon || '').trim()
  links.push({
    id: nanoid(),
    categoryId,
    title,
    url,
    icon: iconInput || faviconFor(url),
    description: String(form.description || '').trim() || undefined,
    sort: nextSort(siblings),
    newTab: !!form.newTab,
    status: 'active',
    source: 'admin',
    createdAt: Date.now(),
  })
  await putLinks(c.env.NODE_NAV_KV, links)
  return c.redirect('/admin')
})

// ---------- 链接：编辑 ----------
pages.get('/admin/link/:id/edit', async (c) => {
  const links = await getLinks(c.env.NODE_NAV_KV)
  const link = links.find((l) => l.id === c.req.param('id'))
  if (!link) return c.redirect('/admin')
  const cats = await getCategories(c.env.NODE_NAV_KV)
  return c.html(<LinkEdit link={link} categories={cats} />)
})

pages.post('/admin/link/:id/edit', async (c) => {
  const id = c.req.param('id')
  const links = await getLinks(c.env.NODE_NAV_KV)
  const link = links.find((l) => l.id === id)
  if (!link) return c.redirect('/admin')

  const form = await c.req.parseBody()
  const title = String(form.title || '').trim()
  const url = String(form.url || '').trim()
  const categoryId = String(form.categoryId || '')
  if (!title || !url || !categoryId) return c.redirect(`/admin/link/${id}/edit`)
  try {
    new URL(url)
  } catch {
    return c.redirect(`/admin/link/${id}/edit`)
  }

  // 切换分类时，重新计算 sort
  if (link.categoryId !== categoryId) {
    const siblings = links.filter(
      (l) => l.categoryId === categoryId && l.id !== id,
    )
    link.categoryId = categoryId
    link.sort = nextSort(siblings)
  }

  link.title = title
  link.url = url
  const iconInput = String(form.icon || '').trim()
  link.icon = iconInput || faviconFor(url)
  link.description = String(form.description || '').trim() || undefined
  link.newTab = !!form.newTab

  await putLinks(c.env.NODE_NAV_KV, links)
  return c.redirect('/admin')
})

// ---------- 链接：删除 ----------
pages.post('/admin/link/:id/delete', async (c) => {
  const id = c.req.param('id')
  const links = await getLinks(c.env.NODE_NAV_KV)
  await putLinks(c.env.NODE_NAV_KV, links.filter((l) => l.id !== id))
  return c.redirect('/admin')
})

// ---------- 链接：上下移 ----------
pages.post('/admin/link/:id/move/:dir', async (c) => {
  const id = c.req.param('id')
  const dir = c.req.param('dir') as 'up' | 'down'
  const links = await getLinks(c.env.NODE_NAV_KV)
  const link = links.find((l) => l.id === id)
  if (!link) return c.redirect('/admin')
  const siblings = links
    .filter((l) => l.categoryId === link.categoryId)
    .sort((a, b) => a.sort - b.sort)
  const idx = siblings.findIndex((s) => s.id === id)
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return c.redirect('/admin')
  const tmp = siblings[idx].sort
  siblings[idx].sort = siblings[swapIdx].sort
  siblings[swapIdx].sort = tmp
  await putLinks(c.env.NODE_NAV_KV, links)
  return c.redirect('/admin')
})

// ---------- 占位：尚未实现的后台页（Phase D） ----------
pages.get('/admin/pending', async (c) => {
  const [submissions, categories, settings] = await Promise.all([
    getSubmissions(c.env.NODE_NAV_KV),
    getCategories(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
  ])
  return c.html(<Pending submissions={submissions} categories={categories} glassEffect={settings.useGlassEffect} />)
})

// ---------- 公开提交页（无需登录） ----------
pages.get('/submit', async (c) => {
  const [settings, categories] = await Promise.all([
    getSettings(c.env.NODE_NAV_KV),
    getCategories(c.env.NODE_NAV_KV),
  ])
  const s = c.req.query('s')
  const status =
    s === 'ok' ? 'ok' : s === 'invalid' ? 'invalid' : undefined
  return c.html(<Submit categories={categories} settings={settings} status={status as any} />)
})

pages.post('/submit', async (c) => {
  const settings = await getSettings(c.env.NODE_NAV_KV)
  if (!settings.submissionEnabled) {
    return c.redirect('/submit')
  }

  const form = await c.req.parseBody()

  // 蜜罐：bot 会乱填，正常用户不会
  if (String(form.website || '').trim() !== '') {
    // 静默接受，不写库
    return c.redirect('/submit?s=ok')
  }

  const title = String(form.title || '').trim()
  const url = String(form.url || '').trim()
  if (!title || !url || title.length > 100) {
    return c.redirect('/submit?s=invalid')
  }
  try {
    new URL(url)
  } catch {
    return c.redirect('/submit?s=invalid')
  }

  const submissions = await getSubmissions(c.env.NODE_NAV_KV)
  const newSub: Submission = {
    id: nanoid(),
    title,
    url,
    suggestedCategoryId: String(form.suggestedCategoryId || '') || undefined,
    reason: String(form.reason || '').trim().slice(0, 300) || undefined,
    submitter: String(form.submitter || '').trim().slice(0, 60) || undefined,
    submittedAt: Date.now(),
  }
  submissions.push(newSub)
  await putSubmissions(c.env.NODE_NAV_KV, submissions)
  return c.redirect('/submit?s=ok')
})

// ---------- 后台：审核通过 ----------
pages.post('/admin/pending/:id/approve', async (c) => {
  const id = c.req.param('id')
  const form = await c.req.parseBody()
  const categoryId = String(form.categoryId || '')
  if (!categoryId) return c.redirect('/admin/pending')

  const [submissions, cats, links] = await Promise.all([
    getSubmissions(c.env.NODE_NAV_KV),
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
  ])
  const sub = submissions.find((s) => s.id === id)
  if (!sub) return c.redirect('/admin/pending')
  if (!cats.find((c) => c.id === categoryId)) return c.redirect('/admin/pending')

  const siblings = links.filter((l) => l.categoryId === categoryId)
  links.push({
    id: nanoid(),
    categoryId,
    title: sub.title,
    url: sub.url,
    icon: faviconFor(sub.url),
    description: sub.reason,
    sort: nextSort(siblings),
    newTab: true,
    status: 'active',
    source: 'user',
    createdAt: Date.now(),
  })

  await Promise.all([
    putLinks(c.env.NODE_NAV_KV, links),
    putSubmissions(c.env.NODE_NAV_KV, submissions.filter((s) => s.id !== id)),
  ])
  return c.redirect('/admin/pending')
})

// ---------- 后台：拒绝 ----------
pages.post('/admin/pending/:id/reject', async (c) => {
  const id = c.req.param('id')
  const submissions = await getSubmissions(c.env.NODE_NAV_KV)
  await putSubmissions(c.env.NODE_NAV_KV, submissions.filter((s) => s.id !== id))
  return c.redirect('/admin/pending')
})

// ---------- 导入 / 导出页 ----------
const STATUS_MAP: Record<string, { kind: 'ok' | 'err'; msg: string }> = {
  imported_html: { kind: 'ok', msg: '✅ HTML 书签导入成功' },
  imported_json: { kind: 'ok', msg: '✅ JSON 备份已恢复，所有数据已替换' },
  nofile: { kind: 'err', msg: '❌ 没有选择文件' },
  badjson: { kind: 'err', msg: '❌ JSON 解析失败，文件可能损坏' },
  badformat: { kind: 'err', msg: '❌ 文件格式不正确（缺少 categories 或 links）' },
  empty: { kind: 'err', msg: '⚠️ 文件中没有解析到任何书签' },
}

pages.get('/admin/import-export', async (c) => {
  const [cats, links, submissions, settings] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
    getSubmissions(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
  ])
  const key = c.req.query('s') || ''
  const status = STATUS_MAP[key]
  return c.html(
    <ImportExport
      status={status}
      stats={{ categoryCount: cats.length, linkCount: links.length }}
      pendingCount={submissions.length}
      glassEffect={settings.useGlassEffect}
    />,
  )
})

// ---------- 导出 JSON ----------
pages.get('/admin/export/json', async (c) => {
  const [categories, links, settings, submissions] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
    getSubmissions(c.env.NODE_NAV_KV),
  ])
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    categories,
    links,
    settings,
    submissions,
  }
  const date = new Date().toISOString().slice(0, 10)
  c.header('Content-Type', 'application/json; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="node-nav-backup-${date}.json"`)
  return c.body(JSON.stringify(backup, null, 2))
})

// ---------- 导出 HTML 书签 ----------
pages.get('/admin/export/html', async (c) => {
  const [categories, links] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
  ])
  const html = exportToNetscapeHTML(categories, links)
  const date = new Date().toISOString().slice(0, 10)
  c.header('Content-Type', 'text/html; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="node-nav-bookmarks-${date}.html"`)
  return c.body(html)
})

// ---------- 导入 HTML 书签（追加模式） ----------
pages.post('/admin/import/html', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.redirect('/admin/import-export?s=nofile')

  const html = await file.text()
  const { categories: newCats, links: newLinks } = parseNetscapeHTML(html)
  if (newCats.length === 0 && newLinks.length === 0) {
    return c.redirect('/admin/import-export?s=empty')
  }

  const [existingCats, existingLinks] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
  ])

  // 把新的顶层分类排到现有顶层之后
  const topMax = existingCats
    .filter((c) => c.parentId === null)
    .reduce((m, c) => Math.max(m, c.sort), 0)
  let i = 0
  newCats
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.sort - b.sort)
    .forEach((c) => {
      c.sort = topMax + (++i) * 10
    })

  await Promise.all([
    putCategories(c.env.NODE_NAV_KV, [...existingCats, ...newCats]),
    putLinks(c.env.NODE_NAV_KV, [...existingLinks, ...newLinks]),
  ])
  return c.redirect('/admin/import-export?s=imported_html')
})

// ---------- 导入 JSON 备份（覆盖模式） ----------
pages.post('/admin/import/json', async (c) => {
  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) return c.redirect('/admin/import-export?s=nofile')

  let parsed: any
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    return c.redirect('/admin/import-export?s=badjson')
  }

  if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.links)) {
    return c.redirect('/admin/import-export?s=badformat')
  }

  await Promise.all([
    putCategories(c.env.NODE_NAV_KV, parsed.categories),
    putLinks(c.env.NODE_NAV_KV, parsed.links),
    parsed.settings ? putSettings(c.env.NODE_NAV_KV, parsed.settings) : Promise.resolve(),
  ])
  return c.redirect('/admin/import-export?s=imported_json')
})

// ---------- 站点设置：查看 ----------
pages.get('/admin/settings', async (c) => {
  const [settings, submissions, bingImages] = await Promise.all([
    getSettings(c.env.NODE_NAV_KV),
    getSubmissions(c.env.NODE_NAV_KV),
    getBingImages(c.env.NODE_NAV_KV),
  ])

  // 为设置页提供 bg 预览图（与 Home 同样规则解析）
  let previewBg: string | undefined
  if (settings.bgMode === 'bing' && bingImages.length > 0) {
    const picks = (settings.bgBingPicks || []).filter((i) => i >= 0 && i < bingImages.length)
    const pool = picks.length > 0 ? picks.map((i) => bingImages[i]) : bingImages
    previewBg = pickRandom(pool)?.url
  } else if (settings.bgMode === 'custom' && settings.bgCustomUrl) {
    previewBg = settings.bgCustomUrl
  }

  return c.html(
    <Settings
      settings={settings}
      saved={c.req.query('saved') === '1'}
      pendingCount={submissions.length}
      bingImages={bingImages}
      bgImageUrl={previewBg}
    />,
  )
})

const VALID_THEMES = ['auto', 'light', 'dark', 'cupcake', 'corporate', 'business', 'synthwave', 'emerald'] as const
const VALID_CARD_SIZES = ['compact', 'normal', 'large'] as const

// ---------- 站点设置：保存全部 ----------
pages.post('/admin/settings', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const settings = await getSettings(c.env.NODE_NAV_KV)

  const siteName = String(form.siteName || '').trim()
  if (!siteName) {
    return c.html(<Settings settings={settings} error="站点名称不能为空" />, 400)
  }
  settings.siteName = siteName
  settings.siteTitle = String(form.siteTitle || '').trim() || siteName
  settings.siteDescription = String(form.siteDescription || '').trim()
  settings.siteKeywords = String(form.siteKeywords || '').trim()
  settings.logoText = String(form.logoText || '').trim() || siteName

  const logoUrl = String(form.logoUrl || '').trim()
  if (logoUrl) {
    try {
      new URL(logoUrl)
      settings.logoUrl = logoUrl
    } catch {
      return c.html(<Settings settings={settings} error="Logo 图片 URL 格式不合法" />, 400)
    }
  } else {
    settings.logoUrl = undefined
  }

  settings.footerHtml = String(form.footerHtml || '').trim()

  const theme = String(form.theme || 'auto')
  if ((VALID_THEMES as readonly string[]).includes(theme)) {
    settings.theme = theme as SiteSettings['theme']
  }

  const cardSize = String(form.cardSize || 'normal')
  if ((VALID_CARD_SIZES as readonly string[]).includes(cardSize)) {
    settings.cardSize = cardSize as SiteSettings['cardSize']
  }

  // —— 背景模式 ——
  const bgMode = String(form.bgMode || 'off')
  if (bgMode === 'off' || bgMode === 'bing' || bgMode === 'custom') {
    settings.bgMode = bgMode
  }
  // Bing 选中索引（多选，name=bgBingPicks）
  const picksField = form.bgBingPicks
  const picksArr: number[] = Array.isArray(picksField)
    ? picksField.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n) && n >= 0 && n < 8)
    : picksField
    ? [parseInt(String(picksField), 10)].filter((n) => Number.isFinite(n) && n >= 0 && n < 8)
    : []
  settings.bgBingPicks = picksArr
  // 自定义 URL
  const customUrl = String(form.bgCustomUrl || '').trim()
  if (customUrl) {
    try {
      new URL(customUrl)
      settings.bgCustomUrl = customUrl
    } catch {
      // 格式错误：保留旧值
    }
  } else {
    settings.bgCustomUrl = undefined
  }
  // 背景透明度
  const bgPct = parseInt(String(form.bgOpacity || '100'), 10)
  if (Number.isFinite(bgPct)) {
    settings.bgOpacity = Math.max(0.1, Math.min(1, bgPct / 100))
  }
  // 兼容：清理旧字段
  settings.useBingBackground = undefined

  // —— 毛玻璃 ——
  settings.useGlassEffect = !!form.useGlassEffect
  const opPct = parseInt(String(form.glassOpacity || '60'), 10)
  if (Number.isFinite(opPct)) {
    settings.glassOpacity = Math.max(0.1, Math.min(0.9, opPct / 100))
  }

  settings.submissionEnabled = !!form.submissionEnabled

  await putSettings(c.env.NODE_NAV_KV, settings)
  return c.redirect('/admin/settings?saved=1')
})

// ---------- 搜索引擎：添加 ----------
pages.post('/admin/settings/engine/add', async (c) => {
  const form = await c.req.parseBody()
  const name = String(form.name || '').trim()
  const url = String(form.url || '').trim()
  const queryParam = String(form.queryParam || '').trim()
  if (!name || !url || !queryParam) return c.redirect('/admin/settings')
  try {
    new URL(url)
  } catch {
    return c.redirect('/admin/settings')
  }
  const settings = await getSettings(c.env.NODE_NAV_KV)
  settings.searchEngines.push({ id: nanoid(), name, url, queryParam })
  await putSettings(c.env.NODE_NAV_KV, settings)
  return c.redirect('/admin/settings')
})

// ---------- 搜索引擎：删除 ----------
pages.post('/admin/settings/engine/:id/delete', async (c) => {
  const id = c.req.param('id')
  const settings = await getSettings(c.env.NODE_NAV_KV)
  // 防止删光（至少保留 1 个）
  if (settings.searchEngines.length <= 1) return c.redirect('/admin/settings')
  settings.searchEngines = settings.searchEngines.filter((e) => e.id !== id)
  await putSettings(c.env.NODE_NAV_KV, settings)
  return c.redirect('/admin/settings')
})

// ========== Phase E：拖拽排序 ==========

// 重排链接（前端拖拽完成后调用）
pages.post('/admin/link/reorder', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const categoryId = String(form.categoryId || '')
  const idsField = form.ids
  const ids: string[] = Array.isArray(idsField) ? idsField.map(String) : idsField ? [String(idsField)] : []
  if (!categoryId || ids.length === 0) return c.json({ ok: false }, 400)

  const links = await getLinks(c.env.NODE_NAV_KV)
  // 把传入顺序作为新的 sort
  const order = new Map<string, number>()
  ids.forEach((id, i) => order.set(id, (i + 1) * 10))
  let touched = false
  for (const link of links) {
    if (link.categoryId === categoryId && order.has(link.id)) {
      link.sort = order.get(link.id)!
      touched = true
    }
  }
  if (touched) await putLinks(c.env.NODE_NAV_KV, links)
  return c.json({ ok: true })
})

// ========== Phase F：断链扫描（一次最多 40 条） ==========
const SCAN_BATCH = 40
const SCAN_TIMEOUT_MS = 5000

pages.post('/admin/links/scan', async (c) => {
  const offset = parseInt(c.req.query('offset') || '0', 10)
  const links = await getLinks(c.env.NODE_NAV_KV)
  const total = links.length
  // 按 createdAt 排序的稳定顺序（避免每次顺序变化）
  const sorted = [...links].sort((a, b) => a.createdAt - b.createdAt)
  const slice = sorted.slice(offset, offset + SCAN_BATCH)

  let ok = 0
  let broken = 0
  await Promise.all(
    slice.map(async (link) => {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), SCAN_TIMEOUT_MS)
        const res = await fetch(link.url, {
          method: 'HEAD',
          signal: ctrl.signal,
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; node-nav-bot/1.0; +https://node-nav)',
          },
        })
        clearTimeout(t)
        // 2xx, 3xx, 405 (HEAD 不支持但 URL 存在) 视为正常
        const okStatus = res.ok || res.status === 405 || res.status === 403
        link.status = okStatus ? 'active' : 'broken'
        if (okStatus) ok++
        else broken++
      } catch {
        link.status = 'broken'
        broken++
      }
      link.lastChecked = Date.now()
    }),
  )

  await putLinks(c.env.NODE_NAV_KV, links)

  const nextOffset = offset + SCAN_BATCH
  const qs = new URLSearchParams({
    scan: 'done',
    ok: String(ok),
    broken: String(broken),
    total: String(total),
  })
  if (nextOffset < total) qs.set('next', String(nextOffset))
  return c.redirect(`/admin?${qs.toString()}`)
})

// ========== Phase G：批量操作 ==========

// 批量移动
pages.post('/admin/links/batch-move', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const targetCategoryId = String(form.targetCategoryId || '')
  const idsField = form.ids
  const ids: string[] = Array.isArray(idsField) ? idsField.map(String) : idsField ? [String(idsField)] : []
  if (!targetCategoryId || ids.length === 0) return c.redirect('/admin')

  const [cats, links] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
  ])
  if (!cats.find((cc) => cc.id === targetCategoryId)) return c.redirect('/admin')

  const idSet = new Set(ids)
  // 取目标分类现有 sort 最大值作为基准
  let curMax = links
    .filter((l) => l.categoryId === targetCategoryId && !idSet.has(l.id))
    .reduce((m, l) => Math.max(m, l.sort), 0)
  for (const link of links) {
    if (idSet.has(link.id)) {
      link.categoryId = targetCategoryId
      curMax += 10
      link.sort = curMax
    }
  }
  await putLinks(c.env.NODE_NAV_KV, links)
  return c.redirect('/admin')
})

// 批量删除
pages.post('/admin/links/batch-delete', async (c) => {
  const form = await c.req.parseBody({ all: true })
  const idsField = form.ids
  const ids: string[] = Array.isArray(idsField) ? idsField.map(String) : idsField ? [String(idsField)] : []
  if (ids.length === 0) return c.redirect('/admin')
  const idSet = new Set(ids)
  const links = await getLinks(c.env.NODE_NAV_KV)
  await putLinks(c.env.NODE_NAV_KV, links.filter((l) => !idSet.has(l.id)))
  return c.redirect('/admin')
})
