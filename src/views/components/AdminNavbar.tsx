import type { FC } from 'hono/jsx'

interface Props {
  active?: 'home' | 'settings' | 'pending' | 'import-export'
  pendingCount?: number
}

// 后台公用导航栏
export const AdminNavbar: FC<Props> = ({ active = 'home', pendingCount = 0 }) => {
  const link = (key: string) => (active === key ? 'active' : '')
  return (
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-40">
      <div class="navbar-start">
        <a href="/" class="btn btn-ghost text-xl gap-2">
          <span class="text-primary">⚡</span>
          <span class="font-bold">后台</span>
        </a>
      </div>
      <div class="navbar-center hidden md:flex">
        <ul class="menu menu-horizontal gap-1">
          <li><a href="/admin" class={link('home')}>分类/链接</a></li>
          <li><a href="/admin/settings" class={link('settings')}>站点设置</a></li>
          <li>
            <a href="/admin/pending" class={link('pending')}>
              待审核
              {pendingCount > 0 && (
                <span class="badge badge-error badge-sm">{pendingCount}</span>
              )}
            </a>
          </li>
          <li><a href="/admin/import-export" class={link('import-export')}>导入/导出</a></li>
        </ul>
      </div>
      <div class="navbar-end gap-1">
        <button class="btn btn-ghost btn-square" onclick="toggleTheme()" aria-label="切换暗黑模式">🌓</button>
        <a href="/" class="btn btn-ghost btn-sm">前台</a>
        <form method="post" action="/logout">
          <button class="btn btn-ghost btn-sm" type="submit">登出</button>
        </form>
      </div>
    </div>
  )
}
