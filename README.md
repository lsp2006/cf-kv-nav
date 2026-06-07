# CF-KV Nav

> 🚀 **零服务器**的个人书签导航站 · 跑在 **Cloudflare Workers + KV** 上 · 全球 CDN · 永久免费
>
> 技术栈：**Hono + TypeScript + Cloudflare KV + Tailwind + DaisyUI + HTMX + SortableJS**

> 📜 **本项目基于老王 ([eooce](https://github.com/eooce)) 的 [NAV 项目](https://github.com/llodys/node-nav) 修改重写而来**
>
> v2 已彻底重构：移除 Argo 隧道、哪吒探针、订阅等 VPS 代码，**专注书签导航 + 后台管理**，完全 serverless。

---

## ✨ 特性一览

| 类别 | 功能 |
|---|---|
| 部署 | 0 元 / 0 服务器 / 全球 CDN / 1 行命令上线 |
| 数据 | KV 持久化（分类 / 链接 / 设置 / 投稿队列），不丢数据 |
| 分类 | 任意级嵌套树 + 拖拽排序 + 上下箭头 + 显示/隐藏开关 |
| 链接 | 增删改 + 批量移动 / 删除 + 一键断链扫描（HEAD 探测 + 5s 超时） |
| 备份 | JSON 一键导出导入 + Chrome/Firefox HTML 书签双向兼容 |
| 投稿 | 公开 `/submit` 页（蜜罐反 spam）+ 后台审核队列 + 通过转链接 |
| 主题 | 8 套 DaisyUI 主题 / 暗黑模式 / 自动跟随系统 |
| 背景 | 必应每日图（8 张多选 1）/ 自定义图片 URL / 透明度滑块 |
| 玻璃 | 毛玻璃卡片 + 透明度滑块 + 实时预览 |
| 搜索 | 键入即时过滤书签 / 回车跳搜索引擎（Google/Bing/百度+） |
| 移动端 | 1/2/3/4 列响应式 + Drawer 侧栏 + 触摸友好 |
| 安全 | Cookie + KV token 7 天 TTL · 蜜罐字段 · URL 严格校验 |

---

# 🚀 部署到 Cloudflare（二选一）

| 方式 | 适合谁 | 难度 |
|---|---|---|
| [**方式 A：命令行部署**](#方式-a命令行部署推荐) | 装过 Node.js、用过终端 | ⭐ 5 分钟 |
| [**方式 B：完全图形界面**](#方式-b完全图形界面0-命令行) | 完全没碰过命令行 | ⭐⭐ 10 分钟 |

---

## 方式 A：命令行部署（推荐）

### 🎯 先看大概步骤
> 1. 装 Node.js → 2. 克隆代码 → 3. 登录 Cloudflare → 4. 创建 KV → 5. 改配置 → 6. 改密码 → 7. 部署
>
> **总耗时约 5 分钟，不用花一分钱**

### 0️⃣ 准备工作

| 你需要 | 怎么获得 |
|---|---|
| Node.js 16+ | https://nodejs.org/ 下载 **LTS 版本** → 双击安装一路 Next |
| Git | https://git-scm.com/downloads 下载安装；Mac 通常自带 |
| Cloudflare 账号 | https://dash.cloudflare.com/sign-up 免费注册，邮箱验证即可 |

**Windows 怎么打开终端？** 按 `Win` 键，搜 `PowerShell`，回车打开。

**Mac 怎么打开终端？** 按 `Cmd + Space`，搜 `Terminal`，回车打开。

**Linux 用户**：你应该比我熟。

验证 Node 装好了：

```bash
node --version
# 看到 v18.x.x 或更高就 OK
```

---

### 1️⃣ 克隆项目到本地

把下面这三行命令**逐行**复制到终端，按回车执行：

```bash
git clone https://github.com/lsp2006/cf-kv-nav.git
cd cf-kv-nav
npm install
```

> 💡 **`npm install` 很慢或报错**？设置国内镜像：
> ```bash
> npm config set registry https://registry.npmmirror.com
> npm install
> ```

---

### 2️⃣ 登录 Cloudflare

```bash
npx wrangler login
```

浏览器会**自动打开**一个 Cloudflare 授权页面，点 **Allow** 按钮即可。回到终端会看到 `Successfully logged in`。

> 💡 浏览器没自动打开？终端里会有一个 URL，复制粘贴到浏览器手动打开。

验证登录成功：

```bash
npx wrangler whoami
```

会输出你的 Cloudflare 邮箱和 **Account ID**（一长串字符）。**先记下这个 ID，第 4 步要用**。

---

### 3️⃣ 创建两个 KV 命名空间

KV 是 Cloudflare 提供的免费数据库，用来存书签数据。

```bash
npx wrangler kv namespace create NODE_NAV_KV
npx wrangler kv namespace create NODE_NAV_KV --preview
```

两条命令各会返回一段输出，里面有 `id = "xxxx..."`。**分别记下这两个 id**（共 2 个）。

输出长这样：

```
✨ Success!
[[kv_namespaces]]
binding = "NODE_NAV_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"     ← 这一串
```

```
✨ Success!
[[kv_namespaces]]
binding = "NODE_NAV_KV"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"  ← 这一串
```

---

### 4️⃣ 填配置文件

复制模板：

```bash
cp wrangler.toml.example wrangler.toml
```

用记事本 / VS Code 打开 `wrangler.toml`，替换 **3 处**占位符：

```toml
account_id = "REPLACE_WITH_YOUR_ACCOUNT_ID"      # ← 第 2 步看到的 Account ID
...
id = "REPLACE_WITH_YOUR_KV_ID"                   # ← 第 3 步第 1 个 id
preview_id = "REPLACE_WITH_YOUR_PREVIEW_KV_ID"   # ← 第 3 步第 2 个 preview_id
```

保存。

> 💡 **不想填 account_id**？把那一行**整行删掉**也行，wrangler 会自动用你当前登录的账号。

---

### 5️⃣ 设置管理员密码

**必做这步，否则任何人都能用默认密码 `admin` 改你的导航！**

```bash
npx wrangler secret put ADMIN_PASSWORD
```

会让你输入新密码（**输入时屏幕不显示是正常的**），回车确认。

---

### 6️⃣ 部署上线 🎉

```bash
npm run deploy
```

最后会看到：

```
Deployed cf-kv-nav triggers
  https://cf-kv-nav.<你的子域>.workers.dev
```

那个 URL 就是你的导航站。**打开就能用**。

- 前台首页：`https://cf-kv-nav.<你的子域>.workers.dev`
- 后台登录：`https://cf-kv-nav.<你的子域>.workers.dev/login`

---

### 7️⃣ （可选）绑定自定义域名

只要域名托管在同一个 Cloudflare 账号下：

1. 打开 https://dash.cloudflare.com
2. 左侧栏 → **Workers & Pages** → 点你刚部署的 `cf-kv-nav`
3. **Settings** 标签页 → **Triggers** → **Add Custom Domain**
4. 输入你的域名（比如 `nav.yourdomain.com`）→ 保存

几秒后 DNS 就生效了。

---

## 方式 B：完全图形界面（0 命令行）

完全不会命令行也能部署。需要的就是**点鼠标**。

### 🎯 大概步骤
> 1. Fork 仓库 → 2. CF 后台连 GitHub → 3. 部署 → 4. UI 上加 KV 绑定 → 5. 加密码

### 1️⃣ Fork 仓库到自己 GitHub

打开本仓库主页 → 右上角点 **Fork** 按钮 → 确认。

你会得到一个 `https://github.com/你的用户名/cf-kv-nav` 的副本。

> 没有 GitHub 账号？去 https://github.com/signup 注册一个，1 分钟搞定。

### 2️⃣ 进 Cloudflare 后台

打开 https://dash.cloudflare.com（没账号去 sign-up 注册）

### 3️⃣ 创建 Worker

左侧栏 → **Workers & Pages** → **Create application** → 切到 **Workers** 标签页 → **Connect to Git**

授权 GitHub，挑刚刚 Fork 的 `cf-kv-nav`。

部署设置都用默认值，点 **Save and Deploy**。

### 4️⃣ 创建 KV 命名空间

在左侧栏 → **Workers & Pages** → **KV** → **Create a namespace**

名字填 `NODE_NAV_KV`，保存。

### 5️⃣ 绑定 KV 到 Worker

回到你的 Worker（**Workers & Pages** → 点 `cf-kv-nav`）→ **Settings** → **Bindings** → **Add binding**

- 类型选 **KV Namespace**
- Variable name 填：`NODE_NAV_KV`
- KV namespace 选刚才创建的那个

保存。

### 6️⃣ 设置管理员密码

同样在 **Settings** → **Variables and Secrets** → **Add** → 选 **Secret** 类型：

- 变量名：`ADMIN_PASSWORD`
- 值：你想要的密码（随便定）

保存。

### 7️⃣ 触发重新部署

左侧 **Deployments** 标签 → 找到最新部署右边的 `...` 菜单 → **Retry deployment**

完成。访问那个 `*.workers.dev` 地址即可。

---

# 🆘 常见问题 FAQ

<details>
<summary><strong>Q: npm install 一直卡住或报 404？</strong></summary>

设置国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```
</details>

<details>
<summary><strong>Q: wrangler login 命令报 Error: Browser is not available？</strong></summary>

终端里上方会输出一个 `https://dash.cloudflare.com/oauth2/...` 的 URL。**手动复制**到浏览器打开，授权后回终端，会自动 Successful。
</details>

<details>
<summary><strong>Q: 部署后访问 500 错误？</strong></summary>

99% 是 KV id 没填对。检查：

1. `wrangler.toml` 里 `id` 和 `preview_id` 是不是真的填了第 3 步返回的两个值
2. 终端跑 `npx wrangler kv namespace list` 看看 KV 是否存在
3. 看实时日志找具体错误：`npx wrangler tail`
</details>

<details>
<summary><strong>Q: 忘了管理员密码怎么办？</strong></summary>

终端跑：
```bash
npx wrangler secret put ADMIN_PASSWORD
```
输入新密码即可，旧密码会被立即覆盖。
</details>

<details>
<summary><strong>Q: 怎么备份数据？</strong></summary>

登录后台 → **导入/导出** → **导出 JSON** 即可下载完整备份。建议每月备份一次，存到自己电脑或网盘。

恢复：同一页面 → **恢复 JSON 备份** → 选文件 → 提交。
</details>

<details>
<summary><strong>Q: 想从 Chrome 导入我已有的书签？</strong></summary>

1. Chrome → 设置 → 书签 → 书签管理器 → 右上角三点 → **导出书签** → 得到 `bookmarks_xxx.html`
2. 本项目后台 → **导入/导出** → **导入 HTML 书签** → 选刚才那个文件

会自动按原文件夹结构创建分类。
</details>

<details>
<summary><strong>Q: 想用自己的域名而不是 workers.dev？</strong></summary>

前提：域名已托管在同一 Cloudflare 账号下。

CF Dashboard → **Workers & Pages** → 你的 Worker → **Settings** → **Triggers** → **Add Custom Domain** → 填域名。
</details>

<details>
<summary><strong>Q: KV 数据会丢吗？需要备份吗？</strong></summary>

KV 是 Cloudflare 持久存储，本身不会丢。但**强烈建议**用导出 JSON 功能定期备份，防范误操作。
</details>

<details>
<summary><strong>Q: 改了主题/背景但没生效？</strong></summary>

强刷一下浏览器（`Ctrl+F5` 或 `Cmd+Shift+R`）。也可以试试退出登录再登录。
</details>

<details>
<summary><strong>Q: 想关闭用户投稿功能？</strong></summary>

后台 → **站点设置** → **功能开关** → 取消勾选"开放用户提交链接" → 保存。
</details>

<details>
<summary><strong>Q: 怎么删除部署的 Worker？</strong></summary>

```bash
npx wrangler delete
```

或者去 Dashboard → Workers & Pages → 你的 Worker → Settings → Delete。
</details>

<details>
<summary><strong>Q: 怎么看部署后的实时日志？</strong></summary>

```bash
npx wrangler tail
```

会显示所有访问和错误信息，按 Ctrl+C 退出。
</details>

---

# 📂 项目结构

```
src/
├── index.ts                 # Hono 入口
├── types.ts                 # Bindings + 数据类型
├── lib/
│   ├── kv.ts                # KV 读写
│   ├── auth.ts              # Session token + Cookie
│   ├── id.ts                # 6 字符短 ID
│   ├── migrate.ts           # 首次启动 seed / 旧 schema 兼容
│   ├── bing.ts              # 必应每日图（KV 缓存 23h）
│   └── bookmark-format.ts   # Netscape HTML 书签 import/export
├── data/seed.ts             # 默认种子数据 + DEFAULT_SETTINGS
├── routes/
│   ├── pages.tsx            # 全部页面 + 后台 CRUD
│   └── api.ts               # JSON API（只读，第三方拉取用）
└── views/
    ├── Layout.tsx           # 全局布局（含主题/背景/毛玻璃 CSS 变量）
    ├── Home.tsx             # 前台首页
    ├── Login.tsx            # 登录页
    ├── Admin.tsx            # 后台首页（分类树 + 链接 + 扫描 + 批量）
    ├── Settings.tsx         # 站点设置（含 Bing 选择器、透明度滑块）
    ├── ImportExport.tsx     # 导入/导出
    ├── Submit.tsx           # 公开投稿页
    ├── Pending.tsx          # 后台审核队列
    ├── CategoryEdit.tsx     # 分类编辑表单
    ├── LinkEdit.tsx         # 链接编辑表单
    └── components/
        ├── Navbar.tsx
        ├── AdminNavbar.tsx
        ├── SearchBar.tsx
        ├── CategoryTree.tsx
        └── BookmarkCard.tsx
```

---

# 🔌 公开 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET`  | `/api/bookmarks` | 返回 `{ categories, links, settings }` |
| `POST` | `/api/check-password` | 校验密码（兼容旧前端） |
| `GET`  | `/submit` | 用户投稿页（需站点设置开启） |

---

# 🛠️ 常用维护命令

```bash
# 查看实时日志（调试用）
npx wrangler tail

# 列出 KV 里所有 key
npx wrangler kv key list --binding NODE_NAV_KV

# 查看某个 key 的值
npx wrangler kv key get categories --binding NODE_NAV_KV

# 修改管理员密码
npx wrangler secret put ADMIN_PASSWORD

# 查看部署历史
npx wrangler deployments list

# 删除整个 Worker
npx wrangler delete
```

---

# 🙏 致谢

本项目基于**老王 ([eooce](https://github.com/eooce))** 的 NAV 项目和 [llodys/node-nav](https://github.com/llodys/node-nav) 改造而来，在原项目"VPS + Argo 隧道 + 导航"的基础上，**完全重写为运行在 Cloudflare Workers + KV 上的纯 serverless 版本**，并扩展了大量后台管理能力。

向**老王**和 **llodys** 致以由衷的感谢！

- 老王（原作者）仓库：https://github.com/eooce/nodejs-argo
- llodys（导航 fork）仓库：https://github.com/llodys/node-nav

---

# ⚠️ 免责声明

本项目仅供个人学习与研究使用，请勿将其用于任何违反当地法律法规的场景。
使用本项目所产生的风险由使用者自行承担，与作者无关。
如继续使用，即代表你已同意并接受本免责声明。

---

# 📝 License

MIT
