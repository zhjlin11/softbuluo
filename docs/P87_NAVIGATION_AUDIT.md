# 软游部落 P8.7 全站导航与路由深度审计报告

**审计日期**：2026-11-10  
**审计执行人**：软游部落首席产品架构师、全栈工程师与自动化测试组  
**网站运行环境**：生产环境 `https://softtribe.top/` (腾讯云 Lighthouse)，本地开发 `http://localhost:3000/`  
**核心原则**：生产零修改、本地充分验证、保护现有首页与 Header 视觉、参考华军软件园（Onlinedown）成熟专题与栏目架构。

---

## 1. 现状全量路由与导航映射审计表

| 栏目名称 | Header 配置路径 (审计前) | React Router 路由 (审计前) | 实际状态 | 真实 API 数据源 | 存在的问题与缺失 | P8.7 整改目标路径与方案 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **首页** | `/` | `/` (`HomePage.tsx`) | 正常 (完全成型) | `GET /api/v1/home` (聚合 10 分类/12 精选/10 热门/16 最新/12 工具/8 游戏/4 教程) | 严禁改动视觉与布局，保持原样 | 维持 `/`，保持原样保护 |
| **电脑软件** | `/#featured` | 仅 `/software/:slug` (详情)，无 `/software` 路由 | 锚点回退 / 404 | `GET /api/v1/resources` | 导航点击仅滚动到首页锚点，无独立分类发现、筛选与分页中心 | 建设独立 `/software` 页面，支持分类、平台、授权、排序与分页 |
| **系统工具** | `/#tools` | 仅 `/tool/:slug` (详情)，无 `/system-tools` 路由 | 锚点回退 / 404 | `GET /api/v1/resources?type=TOOL` | 仅首页展示 12 款小工具，缺乏专业电脑维护、场景化排障与高危风险指引 | 建设独立 `/system-tools` 页面，6 大运维排障场景 + 安全警示 + 真实工具库 |
| **游戏中心** | `/#games` | 仅 `/game/:slug` (详情)，无 `/games` 路由 | 锚点回退 / 404 | `GET /api/v1/resources?type=GAME` | 仅首页简单展示，无独立游戏发现、类型过滤、平台与合规下载引导 | 建设独立 `/games` 页面，分类/平台筛选 + 真实游戏封面 + 资源推荐 |
| **装机必备** | `/#essential` | 无对应独立路由 | 锚点回退 | 数据库真实软件组合 | 仅首页锚点，缺少真正成熟的场景化装机方案与清单生成能力 | 建设独立 `/essentials` 页面，8 套经典场景方案 + 安装顺序 + 清单导出生成 |
| **对比评测** | `/compare` | `/compare` (`ComparisonListPage.tsx`)<br/>`/compare/:slug` (`ComparisonDetailPage.tsx`) | 正常 (独立成型) | `GET /api/v1/comparisons`<br/>`GET /api/v1/comparisons/:slug` | 功能完整，需校验与全站导航面包屑风格统一与响应式体验 | 维持 `/compare` 与 `/compare/:slug`，保持并完善移动端适配 |
| **社区交流** | `/community` | `/community` (`CommunityPage.tsx`)<br/>`/community/thread/:id` | 正常 (独立成型) | `GET /api/v1/community/threads` | 功能完整，支持发帖、板块分类与回复互动 | 维持 `/community`，保持并完善移动端适配 |
| **软件教程** | `/#tutorials` | 无公开阅读路由 (仅后台 `/admin/tutorials`) | 锚点回退 / 缺少前台页面 | `GET /api/v1/tutorials`<br/>`GET /api/v1/tutorials/:slug` (后端已具备) | 前台用户无法系统查阅 45+ 篇已收录教程，缺少目录结构、阅读进度与关联软件下载 | 建设独立 `/tutorials` 列表页与 `/tutorials/:slug` 深度图文阅读详情页 |
| **最新更新** | `/#updates` | 无对应独立路由 | 锚点回退 | 数据库 `SoftwareVersion` (162 条) | 未严格区分“新收录资源”与“已有软件版本更新”，缺少更新日志 (Changelog) 时间线 | 建设独立 `/updates` 页面，严格区分收录与更新，展示版本号、日期、平台、日志与直达下载 |
| **软件专题中心** | 未在主导航顶栏 | 仅 `/topics/:slug` (详情)，缺少 `/topics` 汇总页 | 缺少入口与索引 | `GET /api/v1/topics` (29 个专题) | 缺乏像华军软件园 `/zt/` 一样的专题聚合中心，用户无法按分类系统浏览专题 | 建设独立 `/topics` 专题门户中心，分类展示热门/必备/工具/影音合集，直达详情 |

---

## 2. 数据库模型与现有资产盘点

经本地真实 PostgreSQL 16 数据库审计，现有核心数据资产如下：
- **已发布软件资源 (`Software`)**：61 款（全部经人工核验，具有真实官网、哈希与元数据）
- **软件历史与最新版本 (`SoftwareVersion`)**：162 条（包含 Windows 10/11、macOS、Linux 等多架构记录与 releaseDate）
- **软件与系统分类 (`Category`)**：10 大核心分类（系统工具、办公软件、影音播放、网络工具、安全防护、图形图像、编程开发、硬件驱动、游戏娱乐、实用工具）
- **软件专题 (`Topic`)**：29 个精编专题（包含装机必备合集、清理优化专题、录屏剪辑工具包、网盘下载工具等）
- **软件使用教程 (`Tutorial`)**：45 篇系统教程（涵盖安装指引、故障修复、环境配置与技巧技巧）
- **软件横向对比 (`SoftwareComparison`)**：多篇专业参数横向对比（含下载器对比、解压工具对比、代码编辑器对比）

---

## 3. SEO、Canonical 与安全合规审计

1. **URL 统一性与 Canonical 规约**：
   - 所有新建独立栏目规范使用全小写 kebab-case 路径：`/software`, `/system-tools`, `/games`, `/essentials`, `/tutorials`, `/updates`, `/topics`。
   - 保留旧版可能存在的锚点兼容跳转（如访问 `/#featured` 友好定位或导航栏无缝平滑切至新独立页）。
   - 服务端及前端通过 `<title>`、`<meta name="description">`、`<link rel="canonical" href="https://softtribe.top/...">` 统一权重，防止重复内容与权重分散。

2. **生产安全与数据隔离规约**：
   - 不修改线上数据库，不对生产环境执行无授权请求。
   - 所有页面仅拉取 `status = 'PUBLISHED'` 且 `isTestData = false` 的合法资源，严防草稿、待审或私密配置向外部泄露。

3. **移动端响应式 (Responsive) 规约**：
   - 保持 390px (iPhone 12/13/14)、430px (iPhone 15 Pro Max)、768px (iPad/Tablet)、1024px 与 1440px 桌面端全尺寸自适应。
   - 适配移动端折叠汉堡菜单与触控交互。

---

## 4. 实施计划与交付清单

1. **后端 API 完善**：
   - 扩展 `/api/v1/resources` 支持按 `sort` (popular, latest, downloads, name)、`platform`、`license` 筛选。
   - 新增 `/api/v1/versions/feed` 提供最新版本更新时间线（严格按版本发布时间而非建表时间排序）。
2. **前端独立页面建设**：
   - `src/pages/SoftwarePage.tsx` (`/software`)
   - `src/pages/SystemToolsPage.tsx` (`/system-tools`)
   - `src/pages/GamesPage.tsx` (`/games`)
   - `src/pages/EssentialsPage.tsx` (`/essentials`)
   - `src/pages/TutorialsPage.tsx` (`/tutorials`)
   - `src/pages/TutorialDetailPage.tsx` (`/tutorials/:slug`)
   - `src/pages/UpdatesPage.tsx` (`/updates`)
   - `src/pages/TopicsIndexPage.tsx` (`/topics`)
3. **路由挂载与导航激活**：
   - 在 `src/App.tsx` 中注册新页面懒加载与路由。
   - 在 `src/components/layout/SiteHeader.tsx` 中更新对应链接，严格保持原标题、顺序、字体、图标与高亮逻辑。
4. **测试与质量检验**：
   - 编写自动化全量回归测试套件 `server/tests/p87NavigationPagesTest.ts`，集成至 `runAllQualityTests.ts`。
   - 执行 TypeScript / Vite 生产构建。
   - Playwright 真实浏览器全分辨率与深色模式巡检并生成快照。
