import { Hono } from 'hono'
import type { Bindings } from '../types'
import { getCategories, getLinks, getSettings } from '../lib/kv'

// JSON API（保留只读端点，便于第三方拉取）
export const api = new Hono<{ Bindings: Bindings }>()

// 读取全部数据
api.get('/bookmarks', async (c) => {
  const [categories, links, settings] = await Promise.all([
    getCategories(c.env.NODE_NAV_KV),
    getLinks(c.env.NODE_NAV_KV),
    getSettings(c.env.NODE_NAV_KV),
  ])
  return c.json({ categories, links, settings })
})

// 兼容老前端：密码校验
api.post('/check-password', async (c) => {
  try {
    const { password } = await c.req.json<{ password?: string }>()
    if (password === c.env.ADMIN_PASSWORD) return c.json({ success: true })
  } catch {}
  return c.json({ success: false, message: '密码错误' }, 401)
})
