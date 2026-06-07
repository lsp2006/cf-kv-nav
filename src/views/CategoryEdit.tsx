import type { FC } from 'hono/jsx'
import type { Category } from '../types'
import { Layout } from './Layout'

interface Props {
  category?: Category
  parentOptions: Category[]   // 所有分类（用于父级下拉）
  defaultParentId?: string | null
  error?: string
}

export const CategoryEdit: FC<Props> = ({
  category,
  parentOptions,
  defaultParentId,
  error,
}) => {
  const isNew = !category
  const action = isNew ? '/admin/category/new' : `/admin/category/${category!.id}/edit`
  return (
    <Layout title={`${isNew ? '新建' : '编辑'}分类 - Node Nav`}>
      <div class="min-h-screen">
        <div class="navbar bg-base-100 shadow-sm">
          <div class="navbar-start">
            <a href="/admin" class="btn btn-ghost">← 返回</a>
          </div>
        </div>
        <main class="container mx-auto px-3 sm:px-6 py-6 max-w-xl">
          <div class="card bg-base-100 shadow-sm border border-base-300/40">
            <div class="card-body p-4 sm:p-6">
              <h2 class="card-title">{isNew ? '新建分类' : '编辑分类'}</h2>

              {error && (
                <div role="alert" class="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}

              <form method="post" action={action} class="space-y-4 mt-2">
                <div class="form-control">
                  <label class="label"><span class="label-text">名称 *</span></label>
                  <input
                    name="name"
                    required
                    maxlength={50}
                    value={category?.name || ''}
                    class="input input-bordered w-full"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">图标（emoji 或留空）</span>
                  </label>
                  <input
                    name="icon"
                    maxlength={10}
                    value={category?.icon || ''}
                    class="input input-bordered w-full"
                    placeholder="📁"
                  />
                </div>

                <div class="form-control">
                  <label class="label"><span class="label-text">父级分类</span></label>
                  <select name="parentId" class="select select-bordered w-full">
                    <option value="">无（顶级分类）</option>
                    {parentOptions
                      .filter((c) => !category || c.id !== category.id)
                      .map((c) => {
                        const selected =
                          (category ? category.parentId : defaultParentId) === c.id
                        return (
                          <option value={c.id} selected={selected}>
                            {c.name}
                          </option>
                        )
                      })}
                  </select>
                </div>

                <div class="form-control">
                  <label class="cursor-pointer label justify-start gap-3">
                    <input
                      type="checkbox"
                      name="visible"
                      value="1"
                      checked={category ? category.visible : true}
                      class="checkbox checkbox-primary"
                    />
                    <span class="label-text">前台显示</span>
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
