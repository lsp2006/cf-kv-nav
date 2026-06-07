import { Hono } from 'hono'
import type { Bindings } from './types'
import { pages } from './routes/pages'
import { api } from './routes/api'

const app = new Hono<{ Bindings: Bindings }>()

// 全局：为所有响应注入安全 + 缓存头
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
})

// JSON API
app.route('/api', api)

// 页面与后台
app.route('/', pages)

// 兜底：未匹配的路径回首页（避免出现 404 裸文本）
app.notFound((c) => c.redirect('/'))

// 全局错误处理
app.onError((err, c) => {
  console.error('[node-nav]', err)
  return c.text('Internal Server Error', 500)
})

export default app
