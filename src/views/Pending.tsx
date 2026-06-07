import type { FC } from 'hono/jsx'
import type { Category, Submission } from '../types'
import { Layout } from './Layout'
import { AdminNavbar } from './components/AdminNavbar'

interface Props {
  submissions: Submission[]
  categories: Category[]
  glassEffect?: boolean
}

// 单条提交行
const Row: FC<{ sub: Submission; categories: Category[] }> = ({ sub, categories }) => {
  let hostname = ''
  try {
    hostname = new URL(sub.url).hostname
  } catch {}
  const suggested = sub.suggestedCategoryId
    ? categories.find((c) => c.id === sub.suggestedCategoryId)?.name
    : undefined
  const when = new Date(sub.submittedAt).toLocaleString('zh-CN')

  return (
    <div class="card bg-base-100 border border-base-300/40 shadow-sm">
      <div class="card-body p-4 sm:p-5">
        <div class="flex items-start gap-3 flex-wrap">
          <div class="avatar placeholder shrink-0">
            <div class="w-10 h-10 rounded-lg bg-base-200 overflow-hidden flex items-center justify-center">
              <img
                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=128`}
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                class="w-full h-full object-contain"
              />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-base sm:text-lg">{sub.title}</div>
            <a
              href={sub.url}
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary text-xs break-all"
            >
              {sub.url}
            </a>
            {sub.reason && (
              <div class="mt-2 text-sm text-base-content/70 bg-base-200/50 rounded-lg p-2">
                💡 {sub.reason}
              </div>
            )}
            <div class="mt-2 text-xs text-base-content/50 flex flex-wrap gap-x-3 gap-y-1">
              <span>📅 {when}</span>
              {sub.submitter && <span>👤 {sub.submitter}</span>}
              {suggested && <span>📁 建议：{suggested}</span>}
            </div>
          </div>
        </div>

        {/* 操作区 */}
        <div class="divider my-2"></div>
        <div class="flex flex-wrap gap-2">
          <form
            method="post"
            action={`/admin/pending/${sub.id}/approve`}
            class="flex flex-wrap gap-2 flex-1 min-w-0"
          >
            <select name="categoryId" required class="select select-bordered select-sm flex-1 min-w-0">
              <option value="">选择分类...</option>
              {categories.map((c) => (
                <option value={c.id} selected={sub.suggestedCategoryId === c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" class="btn btn-success btn-sm">
              ✓ 通过
            </button>
          </form>
          <form
            method="post"
            action={`/admin/pending/${sub.id}/reject`}
            onsubmit="return confirm('确定拒绝这条提交？')"
          >
            <button type="submit" class="btn btn-ghost btn-sm text-error">
              ✕ 拒绝
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export const Pending: FC<Props> = ({ submissions, categories, glassEffect }) => {
  const sorted = [...submissions].sort((a, b) => b.submittedAt - a.submittedAt)
  return (
    <Layout title="待审核 - Node Nav" glassEffect={glassEffect}>
      <AdminNavbar active="pending" pendingCount={submissions.length} />

      <main class="container mx-auto max-w-3xl py-6 px-3 sm:px-6 space-y-4">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <h2 class="text-xl font-bold">
            待审核{' '}
            <span class="badge badge-primary">{submissions.length}</span>
          </h2>
          <a href="/admin/settings" class="text-xs link link-hover">
            ⚙️ 在站点设置中开关投稿功能
          </a>
        </div>

        {sorted.length === 0 ? (
          <div class="card bg-base-100 border border-base-300/40">
            <div class="card-body items-center text-center py-12 text-base-content/50">
              <div class="text-5xl">📭</div>
              <p>暂无待审核的提交</p>
            </div>
          </div>
        ) : (
          <div class="space-y-3">
            {sorted.map((sub) => (
              <Row sub={sub} categories={categories} />
            ))}
          </div>
        )}
      </main>
    </Layout>
  )
}
