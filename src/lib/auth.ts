// 基于 KV 的轻量 Session：登录后生成 token 存入 KV（7 天 TTL），通过 Cookie 传递

const SESSION_TTL = 60 * 60 * 24 * 7 // 7 天（秒）
const SESSION_PREFIX = 'session:'
export const SESSION_COOKIE = 'nn_session'

// 生成 32 字节的安全随机 token（hex 编码）
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 创建 Session：在 KV 中写入 token，返回该 token。
 */
export async function createSession(kv: KVNamespace): Promise<string> {
  const token = generateToken()
  await kv.put(`${SESSION_PREFIX}${token}`, '1', { expirationTtl: SESSION_TTL })
  return token
}

/**
 * 校验 Session token 是否有效（存在于 KV 且未过期）。
 */
export async function verifySession(kv: KVNamespace, token: string | undefined): Promise<boolean> {
  if (!token) return false
  const value = await kv.get(`${SESSION_PREFIX}${token}`)
  return value !== null
}

/**
 * 销毁 Session（登出）。
 */
export async function destroySession(kv: KVNamespace, token: string | undefined): Promise<void> {
  if (!token) return
  await kv.delete(`${SESSION_PREFIX}${token}`)
}

/**
 * 拼装 Set-Cookie 头。
 */
export function buildSessionCookie(token: string, maxAge = SESSION_TTL): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

export function buildClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}
