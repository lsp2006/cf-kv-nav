import type { FC } from 'hono/jsx'
import type { Category, Link } from '../types'
import { Layout } from './Layout'

interface Props {
  link?: Link
  categories: Category[]
  defaultCategoryId?: string
  error?: string
}

export const LinkEdit: FC<Props> = ({ link, categories, defaultCategoryId, error }) => {
  const isNew = !link
  const action = isNew ? '/admin/link/new' : `/admin/link/${link!.id}/edit`
  return (
    <Layout title={`${isNew ? '新建' : '编辑'}链接 - Node Nav`}>
      <div class="min-h-screen">
        <div class="navbar bg-base-100 shadow-sm">
          <div class="navbar-start">
            <a href="/admin" class="btn btn-ghost">← 返回</a>
          </div>
        </div>
        <main class="container mx-auto px-3 sm:px-6 py-6 max-w-xl">
          <div class="card bg-base-100 shadow-sm border border-base-300/40">
            <div class="card-body p-4 sm:p-6">
              <h2 class="card-title">{isNew ? '新建链接' : '编辑链接'}</h2>

              {error && (
                <div role="alert" class="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}

              <form method="post" action={action} class="space-y-4 mt-2">
                <div class="form-control">
                  <label class="label"><span class="label-text">标题 *</span></label>
                  <input
                    name="title"
                    required
                    maxlength={100}
                    value={link?.title || ''}
                    class="input input-bordered w-full"
                  />
                </div>

                <div class="form-control">
                  <label class="label"><span class="label-text">URL *</span></label>
                  <input
                    name="url"
                    type="url"
                    required
                    value={link?.url || ''}
                    class="input input-bordered w-full"
                    placeholder="https://example.com"
                  />
                </div>

                <div class="form-control">
                  <label class="label"><span class="label-text">所属分类 *</span></label>
                  <select name="categoryId" required class="select select-bordered w-full">
                    {isNew && <option value="">— 选择分类 —</option>}
                    {categories.map((c) => {
                      const selected =
                        (link ? link.categoryId : defaultCategoryId) === c.id
                      return (
                        <option value={c.id} selected={selected}>
                          {c.name}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">图标 URL（留空自动取 favicon）</span>
                  </label>
                  <input
                    name="icon"
                    type="url"
                    value={link?.icon || ''}
                    class="input input-bordered w-full"
                    placeholder="https://..."
                  />
                </div>

                <div class="form-control">
                  <label class="label"><span class="label-text">描述（可选）</span></label>
                  <textarea
                    name="description"
                    maxlength={200}
                    class="textarea textarea-bordered"
                    rows={2}
                  >
                    {link?.description || ''}
                  </textarea>
                </div>

                <div class="form-control">
                  <label class="cursor-pointer label justify-start gap-3">
                    <input
                      type="checkbox"
                      name="newTab"
                      value="1"
                      checked={link ? link.newTab : true}
                      class="checkbox checkbox-primary"
                    />
                    <span class="label-text">新窗口打开</span>
                  </label>
                </div>

                <div class="flex gap-2 justify-end">
                  <a href="/admin" class="btn btn-ghost">取消</a>
                  <button type="submit" class="btn btn-primary">保存</button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  )
}
