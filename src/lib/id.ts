// 6 字符短 ID 生成器（基于 crypto.getRandomValues）
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function nanoid(size = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  let id = ''
  for (let i = 0; i < size; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return id
}
