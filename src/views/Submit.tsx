import type { FC } from 'hono/jsx'
import type { Category, SiteSettings } from '../types'
import { Layout } from './Layout'

interface Props {
  categories: Category[]
  settings: SiteSettings
  status?: 'ok' | 'closed' | 'invalid'
}

// 公开提交页：未登录也可访问
export const Submit: FC<Props> = ({ categories, settings, status }) => {
  const topCats = categories.filter((c) => c.parentId === null).sort((a, b) => a.sort - b.sort)

  if (!settings.submissionEnabled) {
    return (
      <Layout title={`提交链接 - ${settings.siteName}`} theme={settings.theme}>
        <div class="min-h-screen flex items-center justify-center px-4">
          <div class="card max-w-sm bg-base-100 shadow-2xl">
            <div class="card-body items-center text-center">
              <div class="text-5xl">🚧</div>
              <h2 class="card-title">投稿暂未开放</h2>
              <p class="text-sm text-base-content/60">管理员尚未开放用户提交，请联系站长。</p>
              <a href="/" class="btn btn-primary mt-2">返回首页</a>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`推荐网站 - ${settings.siteName}`} theme={settings.theme}>
      <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-start">
          <a href="/" class="btn btn-ghost">← 返回</a>
        </div>
        <div class="navbar-center">
          <span class="font-bold">推荐网站</span>
        </div>
      </div>

      <main class="container mx-auto max-w-xl px-3 sm:px-6 py-6">
        {status === 'ok' && (
          <div role="alert" class="alert alert-success mb-4">
            <span>✅ 提交成功！等待管理员审核后会公开显示。</span>
          </div>
        )}
        {status === 'invalid' && (
          <div role="alert" class="alert alert-error mb-4">
            <span>❌ 请检查标题和 URL 是否填写正确</span>
          </div>
        )}

        <div class="card bg-base-100 shadow-sm border border-base-300/40">
          <div class="card-body p-4 sm:p-6">
            <h2 class="card-title">📮 推荐一个网站</h2>
            <p class="text-sm text-base-content/60 mb-3">
              管理员审核通过后，你推荐的网站会出现在首页。
            </p>

            <form method="post" action="/submit" class="space-y-4">
              <div class="form-control">
                <label class="label"><span class="label-text">网站名称 *</span></label>
                <input
                  name="title"
                  required
                  maxlength={100}
                  class="input input-bordered"
                  placeholder="例如：Hacker News"
                />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">网址 *</span></label>
                <input
                  name="url"
                  type="url"
                  required
                  class="input input-bordered"
                  placeholder="https://"
                />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">建议分类</span></label>
                <select name="suggestedCategoryId" class="select select-bordered">
                  <option value="">— 无偏好，由管理员决定 —</option>
                  {topCats.map((c) => (
                    <option value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">推荐理由（可选）</span></label>
                <textarea
                  name="reason"
                  maxlength={300}
                  rows={2}
                  class="textarea textarea-bordered"
                  placeholder="为什么推荐它？"
                />
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">你的称呼或邮箱（可选）</span></label>
                <input
                  name="submitter"
                  maxlength={60}
                  class="input input-bordered"
                  placeholder="留空匿名"
                />
              </div>

              {/* 蜜罐字段：CSS 隐藏，bot 会乱填 */}
              <div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">
                <label>请勿填写
                  <input name="website" type="text" tabindex={-1} autocomplete="off" />
                </label>
              </div>

              <button type="submit" class="btn btn-primary w-full">提交推荐</button>
            </form>
          </div>
        </div>
      </main>
    </Layout>
  )
}
