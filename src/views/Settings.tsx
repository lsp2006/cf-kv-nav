import type { FC } from 'hono/jsx'
import type { SiteSettings } from '../types'
import type { BingImage } from '../lib/bing'
import { Layout } from './Layout'
import { AdminNavbar } from './components/AdminNavbar'

interface Props {
  settings: SiteSettings
  saved?: boolean
  error?: string
  pendingCount?: number
  bingImages?: BingImage[]
  bgImageUrl?: string   // 用于设置页本身的实时预览
}

// 主题选项（label/value），每个对应 DaisyUI 内置主题
const THEMES: Array<{ value: string; label: string; sample: string }> = [
  { value: 'auto', label: '跟随系统', sample: 'bg-gradient-to-br from-base-200 to-base-300' },
  { value: 'light', label: '浅色', sample: 'bg-white' },
  { value: 'dark', label: '深色', sample: 'bg-slate-900' },
  { value: 'cupcake', label: 'Cupcake · 柔粉', sample: 'bg-pink-200' },
  { value: 'corporate', label: 'Corporate · 商务', sample: 'bg-blue-50' },
  { value: 'business', label: 'Business · 专业深', sample: 'bg-zinc-900' },
  { value: 'synthwave', label: 'Synthwave · 霓虹', sample: 'bg-purple-700' },
  { value: 'emerald', label: 'Emerald · 翠绿', sample: 'bg-emerald-50' },
]

export const Settings: FC<Props> = ({ settings, saved, error, pendingCount, bingImages = [], bgImageUrl }) => {
  const picks = new Set(settings.bgBingPicks || [])
  const opPct = Math.round((settings.glassOpacity ?? 0.6) * 100)
  const bgPct = Math.round((settings.bgOpacity ?? 1) * 100)
  return (
    <Layout
      title="站点设置 - Node Nav"
      theme={settings.theme}
      bgImageUrl={bgImageUrl}
      bgOpacity={settings.bgOpacity}
      glassEffect={settings.useGlassEffect}
      glassOpacity={settings.glassOpacity}
    >
      <AdminNavbar active="settings" pendingCount={pendingCount} />

      <main class="container mx-auto max-w-3xl py-6 px-3 sm:px-6 space-y-6">
        {saved && (
          <div role="alert" class="alert alert-success">
            <span>✅ 设置已保存</span>
          </div>
        )}
        {error && (
          <div role="alert" class="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* 主表单：保存所有简单字段 */}
        <form method="post" action="/admin/settings" class="space-y-4">
          {/* 基本信息 */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-3">
              <h3 class="card-title text-base">📝 基本信息</h3>
              <div class="form-control">
                <label class="label"><span class="label-text">站点名称</span></label>
                <input name="siteName" required value={settings.siteName} maxlength={50} class="input input-bordered" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">浏览器标签标题 (&lt;title&gt;)</span></label>
                <input name="siteTitle" required value={settings.siteTitle} maxlength={100} class="input input-bordered" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">SEO 描述</span></label>
                <textarea name="siteDescription" maxlength={200} rows={2} class="textarea textarea-bordered">{settings.siteDescription}</textarea>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">SEO 关键词（逗号分隔）</span></label>
                <input name="siteKeywords" value={settings.siteKeywords} maxlength={200} class="input input-bordered" />
              </div>
            </div>
          </div>

          {/* 外观 */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-3">
              <h3 class="card-title text-base">🎨 外观</h3>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">主题</span>
                  <span class="label-text-alt text-xs text-base-content/50">下拉预览，保存生效</span>
                </label>
                <select
                  name="theme"
                  class="select select-bordered"
                  onchange="(function(t){if(t==='auto'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);})(this.value)"
                >
                  {THEMES.map((t) => (
                    <option value={t.value} selected={settings.theme === t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">卡片尺寸</span></label>
                <select name="cardSize" class="select select-bordered">
                  <option value="compact" selected={settings.cardSize === 'compact'}>紧凑</option>
                  <option value="normal" selected={settings.cardSize === 'normal'}>普通</option>
                  <option value="large" selected={settings.cardSize === 'large'}>宽松</option>
                </select>
              </div>
            </div>
          </div>

          {/* —— 首页背景 —— */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-3">
              <h3 class="card-title text-base">🖼️ 首页背景</h3>

              <div class="form-control">
                <label class="label"><span class="label-text">背景来源</span></label>
                <div class="join">
                  <input type="radio" name="bgMode" value="off" aria-label="🚫 关闭" class="join-item btn btn-sm" checked={settings.bgMode === 'off'} onchange="window.__nnSyncBg && window.__nnSyncBg()" />
                  <input type="radio" name="bgMode" value="bing" aria-label="🌅 必应每日图" class="join-item btn btn-sm" checked={settings.bgMode === 'bing'} onchange="window.__nnSyncBg && window.__nnSyncBg()" />
                  <input type="radio" name="bgMode" value="custom" aria-label="🔗 自定义图片" class="join-item btn btn-sm" checked={settings.bgMode === 'custom'} onchange="window.__nnSyncBg && window.__nnSyncBg()" />
                </div>
              </div>

              {/* Bing 8 张缩略图选择 */}
              <div data-bgmode-block="bing" style={settings.bgMode === 'bing' ? '' : 'display:none'}>
                <label class="label">
                  <span class="label-text">
                    勾选想要展示的图片
                    <span id="bing-picked-count" class="badge badge-primary badge-sm ml-2">{picks.size}</span>
                  </span>
                  <span class="label-text-alt text-xs text-base-content/50">
                    不勾任何 = 随机使用全部 {bingImages.length || 8} 张
                  </span>
                </label>

                {bingImages.length === 0 ? (
                  <div class="alert alert-warning text-sm">
                    <span>暂时无法加载必应图片，可稍后刷新重试</span>
                  </div>
                ) : (
                  <>
                    <div class="flex gap-2 mb-2">
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs"
                        onclick="document.querySelectorAll('input[name=bgBingPicks]').forEach(function(cb){cb.checked=true;cb.dispatchEvent(new Event('change'))})"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs"
                        onclick="document.querySelectorAll('input[name=bgBingPicks]').forEach(function(cb){cb.checked=false;cb.dispatchEvent(new Event('change'))})"
                      >
                        反选全部
                      </button>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {bingImages.map((img, i) => {
                        const checked = picks.has(i)
                        return (
                          <label
                            class="bing-thumb relative block cursor-pointer rounded-lg overflow-hidden"
                            data-checked={checked ? 'true' : 'false'}
                            title={img.copyright}
                          >
                            <input
                              type="checkbox"
                              name="bgBingPicks"
                              value={String(i)}
                              checked={checked}
                              onchange="this.closest('.bing-thumb').dataset.checked=this.checked?'true':'false';window.__nnUpdatePickCount&&window.__nnUpdatePickCount()"
                              style="position:absolute;opacity:0;width:1px;height:1px"
                            />
                            <img
                              src={img.thumbUrl}
                              alt=""
                              loading="lazy"
                              class="w-full h-24 object-cover block"
                              onerror={`this.style.background='hsl(var(--b3))';this.style.display='block';this.alt='图片加载失败'`}
                            />
                            <div class="bing-thumb-check absolute top-1 right-1 w-6 h-6 rounded-full bg-base-100/95 border-2 border-base-300 flex items-center justify-center text-xs font-bold shadow-sm">
                              <span class="bing-thumb-mark">✓</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </>
                )}
                <div class="text-xs text-base-content/50 mt-2">
                  每次访问首页随机抽选一张 · 缩略图来自 Bing 缓存 23h
                </div>
              </div>

              {/* 自定义 URL */}
              <div data-bgmode-block="custom" style={settings.bgMode === 'custom' ? '' : 'display:none'}>
                <label class="label">
                  <span class="label-text">图片 URL</span>
                  <span class="label-text-alt text-xs">支持 jpg/png/webp 等</span>
                </label>
                <input
                  type="url"
                  name="bgCustomUrl"
                  value={settings.bgCustomUrl || ''}
                  class="input input-bordered w-full"
                  placeholder="https://example.com/image.jpg"
                />
                {settings.bgCustomUrl && (
                  <div class="mt-2 rounded-lg overflow-hidden border border-base-300">
                    <img src={settings.bgCustomUrl} alt="预览" class="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              {/* 背景透明度（off 模式下不显示） */}
              <div data-bgmode-block="bing" style={settings.bgMode === 'bing' ? '' : 'display:none'}>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">背景透明度</span>
                    <span class="label-text-alt"><span id="bg-pct">{bgPct}</span>%</span>
                  </label>
                  <input
                    type="range"
                    name="bgOpacity"
                    min="10"
                    max="100"
                    value={String(bgPct)}
                    class="range range-primary range-sm"
                    oninput="document.body.style.setProperty('--bg-opacity', this.value/100); document.getElementById('bg-pct').textContent=this.value; var p=document.getElementById('bg-pct-2'); if(p) p.textContent=this.value"
                  />
                  <div class="flex justify-between text-[10px] text-base-content/40 px-1 mt-1">
                    <span>10% 几乎隐形</span>
                    <span>100% 满</span>
                  </div>
                </div>
              </div>
              <div data-bgmode-block="custom" style={settings.bgMode === 'custom' ? '' : 'display:none'}>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">背景透明度</span>
                    <span class="label-text-alt"><span id="bg-pct-2">{bgPct}</span>%</span>
                  </label>
                  <input
                    type="range"
                    name="bgOpacity"
                    min="10"
                    max="100"
                    value={String(bgPct)}
                    class="range range-primary range-sm"
                    oninput="document.body.style.setProperty('--bg-opacity', this.value/100); var p=document.getElementById('bg-pct'); if(p) p.textContent=this.value; document.getElementById('bg-pct-2').textContent=this.value"
                  />
                  <div class="flex justify-between text-[10px] text-base-content/40 px-1 mt-1">
                    <span>10% 几乎隐形</span>
                    <span>100% 满</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* —— 毛玻璃效果 —— */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-3">
              <h3 class="card-title text-base">🪟 毛玻璃</h3>

              <div class="form-control">
                <label class="cursor-pointer label justify-start gap-3">
                  <input
                    type="checkbox"
                    name="useGlassEffect"
                    value="1"
                    checked={settings.useGlassEffect}
                    class="checkbox checkbox-primary"
                    onchange="document.body.classList.toggle('glass-mode', this.checked)"
                  />
                  <span class="label-text">启用毛玻璃效果（卡片和导航栏）</span>
                </label>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">透明度</span>
                  <span class="label-text-alt"><span id="glass-pct">{opPct}</span>%</span>
                </label>
                <input
                  type="range"
                  name="glassOpacity"
                  min="10"
                  max="90"
                  value={String(opPct)}
                  class="range range-primary range-sm"
                  oninput="document.body.style.setProperty('--glass-opacity', this.value/100); document.getElementById('glass-pct').textContent=this.value"
                />
                <div class="flex justify-between text-[10px] text-base-content/40 px-1 mt-1">
                  <span>10% 更透</span>
                  <span>90% 更实</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo & 页脚 */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-3">
              <h3 class="card-title text-base">🪪 Logo & 页脚</h3>
              <div class="form-control">
                <label class="label"><span class="label-text">Logo 文本（导航栏左上）</span></label>
                <input name="logoText" value={settings.logoText} maxlength={30} class="input input-bordered" placeholder="⚡ Node Nav" />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Logo 图片 URL（可选，填了就优先显示图片）</span>
                </label>
                <input name="logoUrl" type="url" value={settings.logoUrl || ''} class="input input-bordered" placeholder="https://..." />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">页脚 HTML（备案号、版权等）</span>
                  <span class="label-text-alt text-warning text-xs">允许 HTML</span>
                </label>
                <textarea name="footerHtml" rows={3} class="textarea textarea-bordered font-mono text-xs">{settings.footerHtml}</textarea>
              </div>
            </div>
          </div>

          {/* 功能开关 */}
          <div class="card bg-base-100 border border-base-300/40 shadow-sm">
            <div class="card-body p-4 sm:p-6 space-y-2">
              <h3 class="card-title text-base">🔧 功能开关</h3>
              <div class="form-control">
                <label class="cursor-pointer label justify-start gap-3">
                  <input type="checkbox" name="submissionEnabled" value="1" checked={settings.submissionEnabled} class="checkbox checkbox-primary" />
                  <span class="label-text">开放用户提交链接（需 Phase D 完成审核界面）</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <a href="/admin" class="btn btn-ghost">取消</a>
            <button type="submit" class="btn btn-primary">💾 保存全部设置</button>
          </div>
        </form>

        {/* 搜索引擎管理（独立 CRUD） */}
        <div class="card bg-base-100 border border-base-300/40 shadow-sm">
          <div class="card-body p-4 sm:p-6 space-y-3">
            <h3 class="card-title text-base">🔍 搜索引擎</h3>
            <p class="text-xs text-base-content/60">
              前台搜索框使用，列表中第一个为默认。至少保留 1 个。
            </p>

            {settings.searchEngines.length === 0 ? (
              <div class="alert alert-warning text-sm">没有搜索引擎，至少新建一个</div>
            ) : (
              <ul class="space-y-2">
                {settings.searchEngines.map((e, i) => (
                  <li class="flex items-center gap-2 p-2 rounded-lg bg-base-200/40">
                    {i === 0 && <span class="badge badge-primary badge-sm">默认</span>}
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm truncate">{e.name}</div>
                      <div class="text-xs text-base-content/50 truncate">{e.url} <span class="opacity-50">?{e.queryParam}=...</span></div>
                    </div>
                    <form
                      method="post"
                      action={`/admin/settings/engine/${e.id}/delete`}
                      onsubmit={`return confirm('删除搜索引擎 ${e.name} ？')`}
                    >
                      <button type="submit" class="btn btn-ghost btn-xs text-error" aria-label="删除">✕</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form method="post" action="/admin/settings/engine/add" class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto_auto] gap-2">
              <input name="name" required maxlength={20} placeholder="名称 (如 DuckDuckGo)" class="input input-bordered input-sm" />
              <input name="url" type="url" required placeholder="https://duckduckgo.com/" class="input input-bordered input-sm" />
              <input name="queryParam" required maxlength={10} placeholder="q" class="input input-bordered input-sm" />
              <button type="submit" class="btn btn-primary btn-sm">+ 添加</button>
            </form>
          </div>
        </div>
      </main>

      {/* 背景模式联动 + Bing 选中状态 + 计数 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bing-thumb{border:3px solid transparent;transition:border-color .15s ease, transform .15s ease}
            .bing-thumb:hover{transform:scale(1.02)}
            .bing-thumb[data-checked="true"]{border-color:hsl(var(--p))}
            .bing-thumb[data-checked="true"] .bing-thumb-check{
              background:hsl(var(--p)) !important;
              border-color:hsl(var(--p)) !important;
              color:hsl(var(--pc)) !important;
            }
            .bing-thumb:not([data-checked="true"]) .bing-thumb-mark{display:none}
            .bing-thumb[data-checked="true"]::after{
              content:'';position:absolute;inset:0;
              background:linear-gradient(135deg, hsl(var(--p) / 0.15), transparent 50%);
              pointer-events:none;
            }
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__nnSyncBg = function(){
              var radio = document.querySelector('input[name=bgMode]:checked');
              var mode = radio ? radio.value : 'off';
              document.querySelectorAll('[data-bgmode-block]').forEach(function(el){
                el.style.display = el.getAttribute('data-bgmode-block') === mode ? '' : 'none';
              });
            };
            window.__nnUpdatePickCount = function(){
              var n = document.querySelectorAll('input[name=bgBingPicks]:checked').length;
              var badge = document.getElementById('bing-picked-count');
              if (badge) badge.textContent = n;
            };
            document.addEventListener('DOMContentLoaded', function(){
              window.__nnSyncBg();
              window.__nnUpdatePickCount();
            });
          `,
        }}
      />
    </Layout>
  )
}
