import type { FC } from 'hono/jsx'
import type { Link } from '../../types'

interface Props {
  link: Link
  size?: 'compact' | 'normal' | 'large'
}

// 单个书签卡片：图标加载失败回退首字母占位 + data-search-text 供前台过滤
export const BookmarkCard: FC<Props> = ({ link, size = 'normal' }) => {
  const fallback = (link.title.charAt(0) || '?').toUpperCase()
  let hostname = ''
  try {
    hostname = new URL(link.url).hostname
  } catch {}
  const searchText = `${link.title} ${hostname} ${link.description ?? ''}`.toLowerCase()

  const pad = size === 'compact' ? 'p-2 sm:p-3' : size === 'large' ? 'p-4 sm:p-5' : 'p-3 sm:p-4'
  const iconSize =
    size === 'compact' ? 'w-8 h-8' : size === 'large' ? 'w-12 h-12' : 'w-10 h-10 sm:w-11 sm:h-11'

  return (
    <a
      href={link.url}
      target={link.newTab ? '_blank' : '_self'}
      rel="noopener noreferrer"
      class="card card-hover bg-base-100 border border-base-300/40 hover:border-primary/40 fade-in"
      aria-label={`访问 ${link.title}`}
      data-bookmark
      data-search-text={searchText}
    >
      <div class={`card-body ${pad} flex-row items-center gap-3`}>
        <div class="avatar placeholder shrink-0">
          <div
            class={`${iconSize} rounded-xl bg-base-200 ring-1 ring-base-300/50 overflow-hidden flex items-center justify-center`}
          >
            {link.icon ? (
              <img
                src={link.icon}
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                class="w-full h-full object-contain"
                onerror={`this.style.display='none';this.parentElement.innerHTML='<span class=\\'text-base font-bold text-base-content/70\\'>${fallback}</span>'`}
              />
            ) : (
              <span class="text-base font-bold text-base-content/70">{fallback}</span>
            )}
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate text-sm sm:text-base">{link.title}</div>
          <div class="text-xs text-base-content/50 truncate">
            {link.description || hostname}
          </div>
        </div>
      </div>
    </a>
  )
}
