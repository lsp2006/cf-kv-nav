// 必应每日图：通过 Bing 公共 API 拉 8 张近期壁纸，KV 缓存 23h，前端随机展示一张

export interface BingImage {
  url: string         // 全尺寸（背景用）
  thumbUrl: string    // 320x180 缩略图（设置页选择器用）
  copyright: string
  title: string
}

const KEY = 'bing:images:v2'   // v2: 缩略图改用通用的 _1920x1080.jpg
const TTL = 60 * 60 * 23 // 23 小时，比 Bing 日更稍提前

/**
 * 读取 Bing 每日图列表（缓存 23h）。失败返回空数组。
 */
export async function getBingImages(kv: KVNamespace): Promise<BingImage[]> {
  const cached = await kv.get<BingImage[]>(KEY, 'json')
  if (cached && cached.length > 0) return cached

  try {
    const res = await fetch(
      'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN',
    )
    if (!res.ok) return []
    const json: any = await res.json()
    if (!Array.isArray(json?.images)) return []
    const images: BingImage[] = json.images
      .filter((img: any) => img?.url && img?.urlbase)
      .map((img: any) => ({
        url: 'https://www.bing.com' + img.url,
        // _1920x1080.jpg 是 Bing 通用尺寸（每张图都有），_320x180 有不少 404
        thumbUrl: 'https://www.bing.com' + img.urlbase + '_1920x1080.jpg',
        copyright: img.copyright || '',
        title: img.title || '',
      }))
    if (images.length === 0) return []
    await kv.put(KEY, JSON.stringify(images), { expirationTtl: TTL })
    return images
  } catch {
    return []
  }
}

export function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}
