import type { FC } from 'hono/jsx'
import type { Category, Link } from '../../types'
import { BookmarkCard } from './BookmarkCard'

interface Props {
  categories: Category[]
  links: Link[]
  cardSize?: 'compact' | 'normal' | 'large'
}

// 递归渲染分类树（前台）
function renderTree(
  cats: Category[],
  links: Link[],
  parentId: string | null,
  depth: number,
  size: 'compact' | 'normal' | 'large',
): any[] {
  return cats
    .filter((c) => c.parentId === parentId && c.visible)
    .sort((a, b) => a.sort - b.sort)
    .map((cat) => {
      const childCats = cats.filter((c) => c.parentId === cat.id && c.visible)
      const catLinks = links
        .filter((l) => l.categoryId === cat.id && l.status === 'active')
        .sort((a, b) => a.sort - b.sort)
      return (
        <section id={`cat-${cat.id}`} class="scroll-mt-20" data-category-section>
          <div class={`flex items-center gap-2 mb-3 ${depth > 0 ? 'mt-6' : ''}`}>
            {cat.icon && <span class="text-xl">{cat.icon}</span>}
            <h2 class={depth === 0 ? 'text-lg sm:text-xl font-bold' : 'text-base font-semibold'}>
              {cat.name}
            </h2>
            <div class="badge badge-ghost">{catLinks.length}</div>
            <div class="flex-1 border-b border-base-300/60"></div>
          </div>
          {catLinks.length > 0 && (
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catLinks.map((l) => (
                <BookmarkCard link={l} size={size} />
              ))}
            </div>
          )}
          {childCats.length > 0 && (
            <div class={`mt-4 ${depth > 0 ? 'pl-4 border-l border-base-300/50' : ''}`}>
              {renderTree(cats, links, cat.id, depth + 1, size)}
            </div>
          )}
        </section>
      )
    })
}

export const CategoryTree: FC<Props> = ({ categories, links, cardSize = 'normal' }) => {
  return <div class="space-y-8">{renderTree(categories, links, null, 0, cardSize)}</div>
}
