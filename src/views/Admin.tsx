import type { FC } from 'hono/jsx'
import type { Category, Link } from '../types'
import { Layout } from './Layout'
import { AdminNavbar } from './components/AdminNavbar'

interface AdminProps {
  categories: Category[]
  links: Link[]
  pendingCount?: number
  glassEffect?: boolean
  glassOpacity?: number
  scanResult?: { ok: number; broken: number; scanned: number; nextOffset?: number; total: number }
}

// 把树扁平化为 [{cat, depth}]
function flatten(
  cats: Category[],
  parentId: string | null = null,
  depth = 0,
): Array<{ cat: Category; depth: number }> {
  const result: Array<{ cat: Category; depth: number }> = []
  cats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sort - b.sort)
    .forEach((cat) => {
      result.push({ cat, depth })
      result.push(...flatten(cats, cat.id, depth + 1))
    })
  return result
}

const CategoryCard: FC<{
  cat: Category
  depth: number
  myLinks: Link[]
  childCount: number
}> = ({ cat, depth, myLinks, childCount }) => {
  return (
    <div
      class="card bg-base-100 border border-base-300/40 shadow-sm"
      style={`margin-left: ${depth * 1.25}rem`}
    >
      <div class="card-body p-3 sm:p-4">
        {/* 分类头 */}
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xl">{cat.icon || '📁'}</span>
          <span class="font-bold text-base sm:text-lg">{cat.name}</span>
          {!cat.visible && <span class="badge badge-warning badge-sm">隐藏</span>}
          <span class="badge badge-ghost badge-sm">{myLinks.length} 链接</span>
          {childCount > 0 && (
            <span class="badge badge-ghost badge-sm">{childCount} 子分类</span>
          )}
          <div class="flex-1"></div>
          <div class="join">
            <form hx-post={`/admin/category/${cat.id}/move/up`} hx-target="body" hx-swap="outerHTML" class="join-item">
              <button class="btn btn-ghost btn-xs" type="submit" aria-label="上移">↑</button>
            </form>
            <form hx-post={`/admin/category/${cat.id}/move/down`} hx-target="body" hx-swap="outerHTML" class="join-item">
              <button class="btn btn-ghost btn-xs" type="submit" aria-label="下移">↓</button>
            </form>
          </div>
          <form hx-post={`/admin/category/${cat.id}/toggle-visible`} hx-target="body" hx-swap="outerHTML">
            <button class="btn btn-ghost btn-xs" type="submit" aria-label="切换显示" title={cat.visible ? '点击隐藏' : '点击显示'}>
              {cat.visible ? '👁' : '🙈'}
            </button>
          </form>
          <a href={`/admin/category/${cat.id}/edit`} class="btn btn-ghost btn-xs">编辑</a>
          <form
            hx-post={`/admin/category/${cat.id}/delete`}
            hx-target="body"
            hx-swap="outerHTML"
            hx-confirm={`确定删除分类「${cat.name}」？将同时删除 ${myLinks.length} 个链接${childCount > 0 ? ` 和 ${childCount} 个子分类` : ''}`}
          >
            <button class="btn btn-ghost btn-xs text-error" type="submit">删除</button>
          </form>
        </div>

        {/* 链接列表（拖拽排序容器） */}
        {myLinks.length > 0 && (
          <div
            class="space-y-1 mt-2"
            data-sortable-links
            data-category-id={cat.id}
          >
            {myLinks.map((link) => {
              const isBroken = link.status === 'broken'
              return (
                <div
                  class={`flex items-center gap-2 p-2 rounded-lg hover:bg-base-200/60 transition ${isBroken ? 'bg-error/5' : ''}`}
                  data-link-row
                  data-id={link.id}
                >
                  {/* 拖拽手柄 */}
                  <span class="drag-handle text-base-content/30 hover:text-base-content/70 px-1" aria-label="拖拽排序" title="拖拽排序">⋮⋮</span>

                  {/* 批量选择 checkbox（关联到外层 batch-form） */}
                  <input
                    type="checkbox"
                    form="batch-form"
                    name="ids"
                    value={link.id}
                    class="checkbox checkbox-sm checkbox-primary"
                    aria-label={`选择 ${link.title}`}
                    onchange="window.__nnUpdateBatch && window.__nnUpdateBatch()"
                  />

                  <div class="avatar placeholder shrink-0">
                    <div class="w-8 h-8 rounded-lg bg-base-200 overflow-hidden flex items-center justify-center">
                      {link.icon ? (
                        <img src={link.icon} alt="" loading="lazy" referrerpolicy="no-referrer" class="w-full h-full object-contain" />
                      ) : (
                        <span class="text-xs">{link.title.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate flex items-center gap-1.5">
                      {link.title}
                      {isBroken && <span class="badge badge-error badge-xs">断链</span>}
                      {link.source === 'user' && <span class="badge badge-info badge-xs">用户投稿</span>}
                    </div>
                    <div class="text-xs text-base-content/50 truncate">{link.url}</div>
                  </div>
                  <a href={`/admin/link/${link.id}/edit`} class="btn btn-ghost btn-xs">编辑</a>
                  <form
                    hx-post={`/admin/link/${link.id}/delete`}
                    hx-target="body"
                    hx-swap="outerHTML"
                    hx-confirm={`确定删除链接「${link.title}」？`}
                  >
                    <button class="btn btn-ghost btn-xs text-error" type="submit" aria-label="删除">✕</button>
                  </form>
                </div>
              )
            })}
          </div>
        )}

        <div class="flex flex-wrap gap-2 mt-2">
          <a href={`/admin/link/new?category=${cat.id}`} class="btn btn-sm btn-outline">+ 添加链接</a>
          <a href={`/admin/category/new?parent=${cat.id}`} class="btn btn-sm btn-outline">+ 子分类</a>
        </div>
      </div>
    </div>
  )
}

export const Admin: FC<AdminProps> = ({ categories, links, pendingCount, glassEffect, glassOpacity, scanResult }) => {
  const flat = flatten(categories)
  const brokenCount = links.filter((l) => l.status === 'broken').length
  const activeCount = links.filter((l) => l.status === 'active').length

  return (
    <Layout title="后台管理 - Node Nav" glassEffect={glassEffect} glassOpacity={glassOpacity}>
      <div class="min-h-screen">
        <AdminNavbar active="home" pendingCount={pendingCount} />

        {/* 批量操作的隐形表单：所有 checkbox/select 通过 form="batch-form" 关联到这里 */}
        <form id="batch-form" method="post" style="display:none"></form>

        <main class="container mx-auto px-3 sm:px-6 py-6 max-w-5xl space-y-4">
          {/* 扫描结果 */}
          {scanResult && (
            <div role="alert" class="alert alert-info">
              <div class="flex-1">
                <div class="font-medium">
                  ✅ 已扫描 {scanResult.scanned} 个链接（{scanResult.ok} 个 OK / {scanResult.broken} 个断链）
                </div>
                {scanResult.nextOffset !== undefined && (
                  <div class="text-xs">
                    共 {scanResult.total} 个，还剩 {scanResult.total - scanResult.nextOffset} 个未扫描
                  </div>
                )}
              </div>
              {scanResult.nextOffset !== undefined && (
                <form method="post" action={`/admin/links/scan?offset=${scanResult.nextOffset}`}>
                  <button type="submit" class="btn btn-primary btn-sm">继续扫描</button>
                </form>
              )}
            </div>
          )}

          {/* 统计 */}
          <div class="stats shadow w-full grid-cols-2 sm:grid-cols-4">
            <div class="stat py-3">
              <div class="stat-title text-xs">分类</div>
              <div class="stat-value text-primary text-2xl">{categories.length}</div>
            </div>
            <div class="stat py-3">
              <div class="stat-title text-xs">链接</div>
              <div class="stat-value text-2xl">{activeCount}</div>
            </div>
            <div class="stat py-3">
              <div class="stat-title text-xs">隐藏分类</div>
              <div class="stat-value text-2xl">{categories.filter((c) => !c.visible).length}</div>
            </div>
            <div class="stat py-3">
              <div class="stat-title text-xs">断链</div>
              <div class={`stat-value text-2xl ${brokenCount > 0 ? 'text-error' : ''}`}>{brokenCount}</div>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div class="flex gap-2 flex-wrap">
            <a href="/admin/category/new" class="btn btn-primary btn-sm">+ 新建顶级分类</a>
            <a href="/admin/link/new" class="btn btn-primary btn-sm">+ 新建链接</a>
            <div class="flex-1"></div>
            <form method="post" action="/admin/links/scan">
              <button
                type="submit"
                class="btn btn-warning btn-sm"
                onclick="this.innerHTML='⏳ 扫描中...';this.disabled=true;this.form.submit();"
                title="逐批扫描 40 条，标记断链"
              >
                🔍 扫描断链
              </button>
            </form>
          </div>

          {/* 树 */}
          {flat.length === 0 ? (
            <div class="alert alert-info">还没有任何分类，先创建一个吧</div>
          ) : (
            <div class="space-y-2">
              {flat.map(({ cat, depth }) => {
                const myLinks = links
                  .filter((l) => l.categoryId === cat.id)
                  .sort((a, b) => a.sort - b.sort)
                const childCount = categories.filter((c) => c.parentId === cat.id).length
                return <CategoryCard cat={cat} depth={depth} myLinks={myLinks} childCount={childCount} />
              })}
            </div>
          )}
        </main>

        {/* 浮动批量操作条 */}
        <div
          id="batch-bar"
          class="hidden-bar fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-base-100 border border-base-300/60 rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-2 flex-wrap max-w-[calc(100vw-1rem)]"
        >
          <span class="text-sm font-medium">
            已选 <span id="batch-count" class="badge badge-primary">0</span>
          </span>
          <select
            form="batch-form"
            name="targetCategoryId"
            class="select select-bordered select-sm max-w-[10rem]"
            aria-label="选择目标分类"
          >
            <option value="">移动到...</option>
            {categories
              .filter((c) => c.parentId === null)
              .sort((a, b) => a.sort - b.sort)
              .map((c) => (
                <option value={c.id}>{c.name}</option>
              ))}
          </select>
          <button
            form="batch-form"
            formaction="/admin/links/batch-move"
            class="btn btn-sm btn-primary"
            type="submit"
          >
            移动
          </button>
          <button
            form="batch-form"
            formaction="/admin/links/batch-delete"
            class="btn btn-sm btn-error"
            type="submit"
            onclick="return confirm('确定删除全部选中的链接？')"
          >
            删除
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onclick="document.querySelectorAll('input[form=batch-form][name=ids]').forEach(function(c){c.checked=false});window.__nnUpdateBatch()"
          >
            取消
          </button>
        </div>

        {/* SortableJS + 批量条联动 */}
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('DOMContentLoaded', function(){
                // —— 批量条：根据 checkbox 状态显示/隐藏 ——
                window.__nnUpdateBatch = function(){
                  var checks = document.querySelectorAll('input[form=batch-form][name=ids]:checked');
                  var bar = document.getElementById('batch-bar');
                  var count = document.getElementById('batch-count');
                  count.textContent = checks.length;
                  if (checks.length > 0) bar.classList.remove('hidden-bar');
                  else bar.classList.add('hidden-bar');
                };

                // —— Sortable.js 初始化 ——
                function initSortable(){
                  if (typeof Sortable === 'undefined') { setTimeout(initSortable, 80); return; }
                  document.querySelectorAll('[data-sortable-links]').forEach(function(el){
                    var categoryId = el.getAttribute('data-category-id');
                    Sortable.create(el, {
                      animation: 150,
                      handle: '.drag-handle',
                      ghostClass: 'sortable-ghost',
                      chosenClass: 'sortable-chosen',
                      onEnd: async function(){
                        var ids = Array.from(el.querySelectorAll('[data-link-row]')).map(function(r){return r.getAttribute('data-id')});
                        var fd = new FormData();
                        fd.append('categoryId', categoryId);
                        ids.forEach(function(id){ fd.append('ids', id) });
                        var res = await fetch('/admin/link/reorder', { method:'POST', body: fd });
                        if (!res.ok) location.reload();
                      }
                    });
                  });
                }
                initSortable();
              });
            `,
          }}
        />
      </div>
    </Layout>
  )
}
