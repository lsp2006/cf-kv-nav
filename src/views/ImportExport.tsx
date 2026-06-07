import type { FC } from 'hono/jsx'
import { Layout } from './Layout'
import { AdminNavbar } from './components/AdminNavbar'

interface Props {
  status?: { kind: 'ok' | 'err'; msg: string }
  stats: {
    categoryCount: number
    linkCount: number
  }
  pendingCount?: number
  glassEffect?: boolean
}

export const ImportExport: FC<Props> = ({ status, stats, pendingCount, glassEffect }) => {
  return (
    <Layout title="导入 / 导出 - Node Nav" glassEffect={glassEffect}>
      <AdminNavbar active="import-export" pendingCount={pendingCount} />

      <main class="container mx-auto max-w-3xl py-6 px-3 sm:px-6 space-y-6">
        {status && (
          <div
            role="alert"
            class={`alert ${status.kind === 'ok' ? 'alert-success' : 'alert-error'}`}
          >
            <span>{status.msg}</span>
          </div>
        )}

        {/* 当前数据概览 */}
        <div class="stats shadow w-full">
          <div class="stat">
            <div class="stat-title">当前分类</div>
            <div class="stat-value text-primary">{stats.categoryCount}</div>
          </div>
          <div class="stat">
            <div class="stat-title">当前链接</div>
            <div class="stat-value">{stats.linkCount}</div>
          </div>
        </div>

        {/* 导出 */}
        <div class="card bg-base-100 border border-base-300/40 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <h3 class="card-title text-base">📤 导出</h3>
            <p class="text-sm text-base-content/60 mb-2">
              一键下载完整数据，建议定期备份。
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/admin/export/json" class="btn btn-primary">
                ⬇ 导出 JSON 备份
                <span class="text-xs opacity-70">含分类/链接/设置</span>
              </a>
              <a href="/admin/export/html" class="btn btn-outline">
                ⬇ 导出 HTML 书签
                <span class="text-xs opacity-70">Chrome/Firefox 兼容</span>
              </a>
            </div>
          </div>
        </div>

        {/* 导入 HTML（追加） */}
        <div class="card bg-base-100 border border-base-300/40 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <h3 class="card-title text-base">📥 导入 HTML 书签</h3>
            <p class="text-sm text-base-content/60 mb-3">
              选择从 Chrome / Edge / Firefox 导出的 <code class="kbd kbd-xs">.html</code> 文件。
              <span class="text-success font-medium"> 追加模式</span>
              —— 不覆盖现有数据，按原文件夹结构自动创建分类。
            </p>
            <form
              method="post"
              action="/admin/import/html"
              enctype="multipart/form-data"
              class="space-y-3"
            >
              <input
                type="file"
                name="file"
                accept=".html,text/html"
                required
                class="file-input file-input-bordered w-full"
              />
              <button type="submit" class="btn btn-primary">
                开始导入
              </button>
            </form>
          </div>
        </div>

        {/* 导入 JSON（覆盖） */}
        <div class="card bg-base-100 border border-error/40 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <h3 class="card-title text-base text-error">⚠️ 恢复 JSON 备份</h3>
            <p class="text-sm text-base-content/60 mb-3">
              选择之前导出的备份文件。
              <span class="text-error font-medium"> 覆盖模式</span>
              —— 会替换当前所有的分类 / 链接 / 站点设置！
            </p>
            <form
              method="post"
              action="/admin/import/json"
              enctype="multipart/form-data"
              class="space-y-3"
              onsubmit="return confirm('⚠️ 这将覆盖当前所有数据，确定继续？')"
            >
              <input
                type="file"
                name="file"
                accept=".json,application/json"
                required
                class="file-input file-input-bordered w-full"
              />
              <button type="submit" class="btn btn-error">
                覆盖恢复
              </button>
            </form>
          </div>
        </div>
      </main>
    </Layout>
  )
}
