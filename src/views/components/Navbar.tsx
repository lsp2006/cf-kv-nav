import type { FC } from 'hono/jsx'
import type { Category } from '../../types'

interface NavbarProps {
  topCategories: Category[]
  isAdmin?: boolean
  logoText: string
  logoUrl?: string
  submissionEnabled?: boolean
}

// 顶部导航栏
export const Navbar: FC<NavbarProps> = ({ topCategories, isAdmin, logoText, logoUrl, submissionEnabled }) => {
  return (
    <div class="navbar bg-base-100/80 backdrop-blur sticky top-0 z-40 shadow-sm">
      <div class="navbar-start">
        <label for="nav-drawer" class="btn btn-ghost btn-square lg:hidden" aria-label="打开菜单">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
        <a href="/" class="btn btn-ghost text-xl gap-2 normal-case">
          {logoUrl ? (
            <img src={logoUrl} alt="" class="h-7" />
          ) : (
            <span class="font-bold tracking-tight">{logoText}</span>
          )}
        </a>
      </div>

      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1 gap-1">
          {topCategories.map((cat) => (
            <li>
              <a href={`#cat-${cat.id}`} class="rounded-lg">
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div class="navbar-end gap-1">
        <button class="btn btn-ghost btn-square" onclick="toggleTheme()" aria-label="切换暗黑模式">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
        {submissionEnabled && (
          <a href="/submit" class="btn btn-ghost btn-sm hidden sm:inline-flex" title="推荐网站">
            📮 推荐
          </a>
        )}
        {isAdmin ? (
          <>
            <a href="/admin" class="btn btn-primary btn-sm hidden sm:inline-flex">管理</a>
            <form method="post" action="/logout" class="hidden sm:block">
              <button class="btn btn-ghost btn-sm" type="submit">登出</button>
            </form>
          </>
        ) : (
          <a href="/login" class="btn btn-primary btn-sm">登录</a>
        )}
      </div>
    </div>
  )
}
