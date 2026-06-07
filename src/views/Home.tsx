import type { FC } from 'hono/jsx'
import type { Category, Link, SiteSettings } from '../types'
import { Layout } from './Layout'
import { Navbar } from './components/Navbar'
import { SearchBar } from './components/SearchBar'
import { CategoryTree } from './components/CategoryTree'

interface HomeProps {
  categories: Category[]
  links: Link[]
  settings: SiteSettings
  isAdmin: boolean
  bgImageUrl?: string
  bgCopyright?: string
}

export const Home: FC<HomeProps> = ({ categories, links, settings, isAdmin, bgImageUrl, bgCopyright }) => {
  const topCats = categories
    .filter((c) => c.parentId === null && c.visible)
    .sort((a, b) => a.sort - b.sort)
  return (
    <Layout
      title={settings.siteTitle}
      description={settings.siteDescription}
      keywords={settings.siteKeywords}
      theme={settings.theme}
      bgImageUrl={bgImageUrl}
      bgOpacity={settings.bgOpacity}
      glassEffect={settings.useGlassEffect}
      glassOpacity={settings.glassOpacity}
    >
      <div class="drawer">
        <input id="nav-drawer" type="checkbox" class="drawer-toggle" />

        <div class="drawer-content flex flex-col">
          <Navbar
            topCategories={topCats}
            isAdmin={isAdmin}
            logoText={settings.logoText}
            logoUrl={settings.logoUrl}
            submissionEnabled={settings.submissionEnabled}
          />

          <main class="container mx-auto px-3 sm:px-6 pb-16 max-w-7xl">
            <SearchBar engines={settings.searchEngines} siteName={settings.siteName} />

            {categories.length === 0 ? (
              <div class="text-center py-20 text-base-content/60">
                还没有书签，<a href="/login" class="link link-primary">登录后台</a>
                添加一个吧 ✨
              </div>
            ) : (
              <CategoryTree categories={categories} links={links} cardSize={settings.cardSize} />
            )}
          </main>

          <footer class="footer footer-center p-6 text-base-content/70 text-xs">
            <div dangerouslySetInnerHTML={{ __html: settings.footerHtml }} />
            {bgCopyright && (
              <div class="text-base-content/40 text-[10px]" title={bgCopyright}>
                🖼️ {bgCopyright.length > 80 ? bgCopyright.slice(0, 80) + '…' : bgCopyright}
              </div>
            )}
          </footer>
        </div>

        <div class="drawer-side z-50">
          <label for="nav-drawer" class="drawer-overlay" aria-label="关闭菜单"></label>
          <aside class="min-h-full w-72 bg-base-100 p-4">
            <div class="flex items-center gap-2 mb-6 px-2">
              <span class="font-bold text-lg">{settings.logoText}</span>
            </div>
            <ul class="menu menu-lg w-full gap-1">
              {topCats.map((cat) => (
                <li>
                  <a
                    href={`#cat-${cat.id}`}
                    onclick="document.getElementById('nav-drawer').checked=false"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
            <div class="divider"></div>
            {isAdmin ? (
              <>
                <a href="/admin" class="btn btn-primary w-full mb-2">进入管理</a>
                <form method="post" action="/logout">
                  <button class="btn btn-ghost w-full" type="submit">登出</button>
                </form>
              </>
            ) : (
              <a href="/login" class="btn btn-primary w-full">登录</a>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  )
}
