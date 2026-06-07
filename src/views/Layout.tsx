import type { FC } from 'hono/jsx'

interface LayoutProps {
  title?: string
  description?: string
  keywords?: string
  theme?: string
  bgImageUrl?: string
  bgOpacity?: number       // 0.1 - 1.0
  glassEffect?: boolean
  glassOpacity?: number    // 0.1 - 0.9
  children?: any
}

// 全局 HTML 布局：Tailwind + DaisyUI + HTMX CDN，含暗黑/毛玻璃/背景三选项
export const Layout: FC<LayoutProps> = ({
  title = 'Node Nav',
  description,
  keywords,
  theme = 'auto',
  bgImageUrl,
  bgOpacity,
  glassEffect,
  glassOpacity,
  children,
}) => {
  const initialAttr = theme === 'auto' ? 'light' : theme
  const bodyClass = [
    'min-h-screen',
    'bg-base-200',
    bgImageUrl ? 'has-bg' : '',
    glassEffect ? 'glass-mode' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const styleVars: string[] = []
  if (bgImageUrl) styleVars.push(`--bg-image:url('${bgImageUrl.replace(/'/g, '%27')}')`)
  if (typeof bgOpacity === 'number') styleVars.push(`--bg-opacity:${bgOpacity}`)
  if (typeof glassOpacity === 'number') styleVars.push(`--glass-opacity:${glassOpacity}`)
  const bodyStyle = styleVars.join(';')

  return (
    <html lang="zh-CN" data-theme={initialAttr}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        <title>{title}</title>

        {/* 防主题闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var pref=${JSON.stringify(theme)};var stored=localStorage.getItem('nn_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=stored||(pref==='auto'?(d?'dark':'light'):pref);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />

        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://unpkg.com/htmx.org@2.0.4" defer></script>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .card-hover{transition:transform .2s ease,box-shadow .2s ease}
              .card-hover:hover{transform:translateY(-2px);box-shadow:0 10px 30px -10px rgba(0,0,0,.15)}
              .fade-in{animation:fadeIn .25s ease-out both}
              @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
              .htmx-indicator{display:none}
              .htmx-request .htmx-indicator{display:inline-flex}
              .htmx-request.htmx-indicator{display:inline-flex}

              /* —— 必应每日图背景 —— */
              body.has-bg::before{
                content:'';position:fixed;inset:0;z-index:-2;
                background-image:var(--bg-image);
                background-size:cover;background-position:center;background-attachment:fixed;
                opacity:var(--bg-opacity, 1);
                transition:opacity .2s ease;
              }
              body.has-bg::after{
                content:'';position:fixed;inset:0;z-index:-1;
                background:linear-gradient(180deg, hsl(var(--b2)/0.35) 0%, hsl(var(--b2)/0.55) 100%);
                backdrop-filter:saturate(110%);
              }
              body.has-bg{background-color:transparent !important}

              /* —— 毛玻璃模式 —— */
              body.glass-mode .card,
              body.glass-mode .stats{
                backdrop-filter:blur(16px) saturate(180%);
                -webkit-backdrop-filter:blur(16px) saturate(180%);
                background-color:hsl(var(--b1) / var(--glass-opacity, 0.6)) !important;
                border-color:hsl(var(--bc) / 0.08) !important;
              }
              body.glass-mode .navbar{
                backdrop-filter:blur(20px) saturate(180%);
                -webkit-backdrop-filter:blur(20px) saturate(180%);
                background-color:hsl(var(--b1) / calc(var(--glass-opacity, 0.6) + 0.1)) !important;
              }
              body.glass-mode .menu li > a:hover,
              body.glass-mode .menu li > a.active{
                background-color:hsl(var(--p) / 0.15) !important;
              }

              /* —— 拖拽视觉 —— */
              .drag-handle{cursor:grab;user-select:none;touch-action:none}
              .drag-handle:active{cursor:grabbing}
              .sortable-ghost{opacity:.4;background:hsl(var(--p)/0.15) !important}
              .sortable-chosen{box-shadow:0 0 0 2px hsl(var(--p)/0.5)}

              /* —— 批量操作浮条 —— */
              #batch-bar{transition:transform .2s ease, opacity .2s ease}
              #batch-bar.hidden-bar{transform:translate(-50%, 200%);opacity:0;pointer-events:none}
            `,
          }}
        />
      </head>
      <body class={bodyClass} style={bodyStyle}>
        {children}
        <div id="toast" class="toast toast-top toast-end z-50"></div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.toggleTheme = function(){
                var cur = document.documentElement.getAttribute('data-theme') || 'light';
                var next = (cur === 'dark') ? 'light' : 'dark';
                if (cur !== 'light' && cur !== 'dark') next = 'dark';
                document.documentElement.setAttribute('data-theme', next);
                try{ localStorage.setItem('nn_theme', next); }catch(e){}
              };
            `,
          }}
        />
      </body>
    </html>
  )
}
