import type { Category, Link } from '../types'
import { nanoid } from './id'

// ============================================================
// Netscape Bookmark File Format（Chrome / Firefox 通用）
// 解析 + 序列化
// ============================================================

const HEADER = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`
const FOOTER = `</DL><p>
`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

// ----------------------- 序列化 -----------------------

/**
 * 把分类树 + 链接序列化为 Netscape HTML 书签格式。
 * 输出可被 Chrome / Firefox / Edge 直接导入。
 */
export function exportToNetscapeHTML(categories: Category[], links: Link[]): string {
  const out: string[] = [HEADER]

  function ts(ms: number): string {
    return String(Math.floor(ms / 1000))
  }

  function renderFolder(parentId: string | null, indent: number) {
    const pad = '    '.repeat(indent)
    const cats = categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sort - b.sort)
    for (const cat of cats) {
      out.push(`${pad}<DT><H3 ADD_DATE="${ts(cat.createdAt)}">${escapeHtml(cat.name)}</H3>\n`)
      out.push(`${pad}<DL><p>\n`)
      // 递归子分类
      renderFolder(cat.id, indent + 1)
      // 当前分类下的链接
      const myLinks = links
        .filter((l) => l.categoryId === cat.id && l.status === 'active')
        .sort((a, b) => a.sort - b.sort)
      for (const link of myLinks) {
        const padL = '    '.repeat(indent + 1)
        const iconAttr = link.icon ? ` ICON="${escapeHtml(link.icon)}"` : ''
        out.push(
          `${padL}<DT><A HREF="${escapeHtml(link.url)}" ADD_DATE="${ts(link.createdAt)}"${iconAttr}>${escapeHtml(link.title)}</A>\n`,
        )
      }
      out.push(`${pad}</DL><p>\n`)
    }
  }

  renderFolder(null, 0)
  out.push(FOOTER)
  return out.join('')
}

// ----------------------- 解析 -----------------------

/**
 * 解析 Netscape HTML 书签文件，返回扁平的 categories + links 数组。
 * 自动维护父子关系（按 DL 嵌套），自动跳过 Chrome 的 PERSONAL_TOOLBAR_FOLDER 包裹层。
 */
export function parseNetscapeHTML(html: string): {
  categories: Category[]
  links: Link[]
} {
  const categories: Category[] = []
  const links: Link[] = []
  const now = Date.now()

  // 用栈跟踪当前所在的父分类 id。栈底 null = 根。
  const stack: (string | null)[] = [null]
  const sortByParent = new Map<string | null, number>()

  function nextSort(parentId: string | null): number {
    const cur = sortByParent.get(parentId) ?? 0
    const next = cur + 10
    sortByParent.set(parentId, next)
    return next
  }

  function faviconFor(url: string): string {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
    } catch {
      return ''
    }
  }

  // 按顺序匹配 4 类标记
  const re =
    /<DT>\s*<H3([^>]*)>([\s\S]*?)<\/H3>|<DT>\s*<A\s+([^>]+)>([\s\S]*?)<\/A>|<DL\s*>|<\/DL\s*>/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(html))) {
    const tag = m[0]

    if (m[1] !== undefined) {
      // ---- 文件夹起始：<DT><H3 attrs>Name</H3> ----
      const attrs = m[1]
      const name = decodeHtml(m[2]).trim()
      if (!name) continue

      // 跳过 Chrome 的"书签栏"包裹层（保持其内容上浮到原层级）
      if (/PERSONAL_TOOLBAR_FOLDER/i.test(attrs)) {
        // 复制栈顶，让后续 </DL> 能正常 pop
        stack.push(stack[stack.length - 1])
        continue
      }

      const parentId = stack[stack.length - 1]
      const cat: Category = {
        id: nanoid(),
        name,
        parentId,
        sort: nextSort(parentId),
        visible: true,
        createdAt: now,
      }
      categories.push(cat)
      stack.push(cat.id)
    } else if (m[3] !== undefined) {
      // ---- 链接：<DT><A attrs>Title</A> ----
      const attrs = m[3]
      const title = decodeHtml(m[4]).trim()
      const hrefMatch = /HREF\s*=\s*"([^"]+)"/i.exec(attrs)
      const iconMatch = /ICON\s*=\s*"([^"]+)"/i.exec(attrs)
      const href = hrefMatch?.[1]
      if (!href || !title) continue
      try {
        new URL(href)
      } catch {
        continue
      }
      let icon = iconMatch?.[1] || ''
      // 丢弃 base64 内嵌图标（体积过大），改用 favicon 服务
      if (icon.startsWith('data:')) icon = ''
      if (!icon) icon = faviconFor(href)

      let categoryId = stack[stack.length - 1]
      // 根层链接：自动归入"未分类"
      if (!categoryId) {
        let unc = categories.find(
          (c) => c.parentId === null && c.name === '未分类',
        )
        if (!unc) {
          unc = {
            id: nanoid(),
            name: '未分类',
            parentId: null,
            sort: nextSort(null),
            visible: true,
            createdAt: now,
          }
          categories.push(unc)
        }
        categoryId = unc.id
      }

      links.push({
        id: nanoid(),
        categoryId,
        title,
        url: href,
        icon,
        sort: nextSort(categoryId),
        newTab: true,
        status: 'active',
        source: 'admin',
        createdAt: now,
      })
    } else if (/^<DL/i.test(tag)) {
      // <DL>：H3 已经处理过栈推入，这里 no-op
    } else if (/^<\/DL/i.test(tag)) {
      // </DL>：弹栈（保留根 null 哨兵）
      if (stack.length > 1) stack.pop()
    }
  }

  return { categories, links }
}
