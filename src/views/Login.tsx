import type { FC } from 'hono/jsx'
import { Layout } from './Layout'

interface LoginProps {
  error?: string
}

// 登录页：单一密码框，POST 到 /login
export const Login: FC<LoginProps> = ({ error }) => {
  return (
    <Layout title="登录 - Node Nav">
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-300/40">
          <div class="card-body">
            <div class="flex items-center justify-center mb-4">
              <div class="text-5xl">🔐</div>
            </div>
            <h2 class="card-title justify-center text-2xl mb-2">后台登录</h2>
            <p class="text-center text-sm text-base-content/60 mb-4">输入管理员密码进入</p>

            <form method="post" action="/login" class="space-y-3">
              <div class="form-control">
                <input
                  type="password"
                  name="password"
                  required
                  autofocus
                  placeholder="管理员密码"
                  class="input input-bordered w-full focus:ring-2 focus:ring-primary/40"
                  aria-label="管理员密码"
                />
              </div>

              {error && (
                <div role="alert" class="alert alert-error py-2 text-sm">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" class="btn btn-primary w-full">登 录</button>
              <a href="/" class="btn btn-ghost w-full">返回首页</a>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
