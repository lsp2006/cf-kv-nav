import type { FC } from 'hono/jsx'
import type { SearchEngine } from '../../types'

interface SearchBarProps {
  engines: SearchEngine[]
  siteName: string
}

// 顶部大搜索框：键入即时过滤前台书签 + 多搜索引擎切换 + Enter 跳转搜索
export const SearchBar: FC<SearchBarProps> = ({ engines, siteName }) => {
  const first = engines[0]
  if (!first) return <></>
  return (
    <div class="hero py-8 sm:py-12">
      <div class="hero-content text-center w-full max-w-2xl">
        <div class="w-full">
          <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
            {siteName}
          </h1>
          <form
            id="searchForm"
            action={first.url}
            method="get"
            target="_blank"
            class="join w-full shadow-lg"
          >
            {engines.length > 1 && (
              <select
                class="select select-bordered join-item"
                aria-label="切换搜索引擎"
                onchange="(function(s){var f=document.getElementById('searchForm');var d=s.options[s.selectedIndex].dataset;f.action=d.url;document.getElementById('searchInput').name=d.qp;})(this)"
              >
                {engines.map((e, i) => (
                  <option data-url={e.url} data-qp={e.queryParam} selected={i === 0}>
                    {e.name}
                  </option>
                ))}
              </select>
            )}
            <input
              id="searchInput"
              type="text"
              name={first.queryParam}
              class="input input-bordered join-item flex-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="键入过滤书签，回车跳转搜索..."
              aria-label="搜索"
              autocomplete="off"
              oninput="window.__nnFilter && window.__nnFilter(this.value)"
            />
            <button class="btn btn-primary join-item" aria-label="搜索">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* 前台书签过滤脚本（仅在 Home 上加载一次） */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__nnFilter = function(q){
              q = (q || '').toLowerCase().trim();
              var cards = document.querySelectorAll('[data-bookmark]');
              cards.forEach(function(el){
                var t = el.getAttribute('data-search-text') || '';
                el.style.display = (!q || t.indexOf(q) !== -1) ? '' : 'none';
              });
              // 隐藏空分类
              document.querySelectorAll('[data-category-section]').forEach(function(sec){
                var visible = sec.querySelectorAll('[data-bookmark]:not([style*="display: none"])');
                sec.style.display = visible.length > 0 ? '' : 'none';
              });
            };
          `,
        }}
      />
    </div>
  )
}
