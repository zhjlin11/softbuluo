# 软游部落 P8.7.1 —— 电脑软件频道 UI 3.0 独立升级交付报告

- **交付状态**：**`P871_LOCAL_PASSED`**（本地开发、全量测试与真浏览器验收全部通过；**严守生产安全原则，未修改任何生产服务器、线上数据库或线上文件**）
- **升级目标**：仅针对顶部导航栏「电脑软件」（`/software`）及其专属组件、聚合接口、后台频道运营配置与 SEO SSR 入口进行 UI 3.0 与业务闭环升级。
- **对比基准**：参照 `https://www.onlinedown.net/soft/` 成熟桌面软件发现门户的功能组织架构，以软游部落蓝白设计系统（`#1769D2` 主色调、`#F5F8FC` 浅灰底、卡片 `12px` 圆角、深色模式支持、`1280px` 最大版心）原生重构。

---

## 一、生产安全红线核验

1. **禁止未授权生产改动**：全过程未执行任何生产服务器 SSH 部署、未修改线上 `.env` / Nginx / PM2、未同步本地数据库至公网、未在生产库运行 Migration。
2. **严格修改边界隔离**：
   - 未改动首页 (`/` / `HomePage.tsx`)、首页 Hero、全站 `SiteHeader.tsx` 视觉与 Logo；
   - 未改动 `/system-tools`、`/games`、`/essentials`、`/compare`、`/community`、`/tutorials`、`/updates` 页面；
   - 未改动 `/software/:slug` 软件详情页结构、下载分发授权规则及会员微信支付逻辑。
3. **上线就绪指引**：已输出独立可执行且带 2 分钟应急回滚方案的 [P871_DEPLOYMENT_PLAN.md](docs/P871_DEPLOYMENT_PLAN.md)，待负责人明确授权后方可部署。

---

## 二、基线缺陷排查与核心业务修复

根据改版前基线审计（详见 [P871_SOFTWARE_BASELINE.md](docs/P871_SOFTWARE_BASELINE.md)），本轮直接从底层根因修复了 5 项影响用户体验的真实缺陷：

| 序号 | 改版前基线缺陷 | 根因定位 | 本轮彻底修复方案 |
| :--- | :--- | :--- | :--- |
| 1 | 顶部筛选出现假高数量「**办公软件 41**」 | `/api/v1/categories` 计数未过滤 `isTestData: false` | 在 `categoryRoutes.ts` 计数中强制排除 `isTestData: true`，并新增 `?excludeType=GAME` 支持；频道聚合接口真实返回 **办公软件 7** |
| 2 | 电脑软件仅显示 **13** 款，点「系统工具 10」返回 **0 条** | 旧版前端请求 `type=SOFTWARE`，错误过滤了 `Windows 11 / 7-Zip / Everything / Git` 等 `15` 款 `TOOL` 类型桌面工具 | 后端 `/api/v1/resources` 新增 `type=DESKTOP`（覆盖 `SOFTWARE + TOOL` 且严厉排除 `GAME / DRAFT / 测试数据`）；频道页展示真实全量 **28** 款桌面软件 |
| 3 | 超长版本号撑破卡片角标（如 `vProPlus 2024 完整离线镜像...`） | 卡片直接渲染 `latestVersion.version` 原文且双标签换行 | 复用 `src/utils/softwareName.ts` 中的 `getSimpleSoftwareName` 与 `getSimpleVersion` 规范展示精简标题与版本，悬停 `title` 保留完整原名 |
| 4 | `/software` Canonical 错误指向首页且缺少 SSR 路由 | `index.html` 固定 `canonical` 为根路径，服务端无 `/software` 路由 | 前端动态更新 `<title>`、`<meta description>`、OpenGraph 与精准 `<link rel="canonical" href=".../software">`；后端新增 `GET /software` SSR 与 Sitemap 索引 |
| 5 | `chrome-logo.svg` 外链在境内网络超时导致断裂图标 | 依赖外部 Google CDN SVG 图标，懒加载场景下引发 Playwright `naturalWidth === 0` | 频道服务及辅助层 `sanitizeChannelIconUrl` 对不可靠外部占位/外链图标返回由平台内置高精度矢量 `officialLogos.tsx` 即时渲染（0ms 零死图） |

---

## 三、UI 3.0 模块化架构与页面区块（`/software`）

1. **紧凑频道头 + 面包屑（实测高度 `82px`）**  
   - 展示 `首页 > 电脑软件`、频道主标题 `<h1>电脑软件频道</h1>`、核心口碑定位与真实资产徽章（`收录 28 款 · 92 条可用源`），直接剔除旧版与 `SiteHeader` 重复的大号页内搜索框。
2. **顶部分类关键词快捷导航条**  
   - 基于真实活跃分类生成：`全部桌面软件 (28)`、`办公软件 7`、`系统工具 10`、`网络工具 4`、`硬件检测 2`、`图像设计 1`、`影音播放 2`、`编程开发 2`（空分类不展示）。
3. **焦点主推 Banner (~60%) + 本周热推 10 宫格 (~40%)**  
   - **左区焦点轮播**：支持 3 组认证专题/焦点软件轮播、上一张/下一张、圆点定位、悬停暂停与 `prefers-reduced-motion` 自动停轮，内置代表资源直达入口。
   - **右区本周热推**：桌面 5×2 紧凑图标矩阵（移动端自动切换 2 列横排瓷砖），聚焦装机高频必备。
4. **热门领域导航卡片**  
   - 展示 7 大活跃桌面软件领域，每张卡附真实可点击代表软件快捷入口（例如办公软件下的 `Office 2024`、`Microsoft 365`、`Office for Mac`）与「筛选本类」跳转。
5. **编辑精选桌面软件**  
   - 8 款官方核验与高人气桌面工具卡片（优先读取后台 `EDITOR_PICK` 配置），严格控制信息密度，单行规范徽章与直达下载按钮。
6. **双口径人气排行榜**  
   - **热门关注 TOP 10**：按站内真实 `viewCount` 降序（如 VS Code 42、Chrome 27、Windows 11 14）。
   - **近期下载点击 TOP 10**：按非测试 `DownloadEvent (isTestEvent=false)` 实时汇总降序（Chrome 9、Git 3、Sublime Text 3），绝不伪造 `9999+` 虚高数据。
7. **分类软件专区与全量多维检索（防空行 Bento 布局）**  
   - 默认分组模式下：大于等于 4 款的主力大类（办公软件、系统工具、网络工具）以 4 列铺排；小于 4 款的垂直类（硬件检测、图像设计、影音播放、编程开发）自动采用并列 2 栏 Bento 布局，彻底消除单卡空行。
   - 交互筛选模式：支持分类、平台（Windows / macOS / Linux）、授权协议（免费 / 开源 / 商业）、排序（浏览热度 / 下载点击 / 最新收录 / 名称）、关键字筛选与真实分页，并配有骨架加载与一键重置空状态。
8. **软件专题推荐、装机教程与选型对比**  
   - 自动排除 P3 自动化测试残留（`topic-p3-*` / `tut-p3-*`），展示 6 大精选桌面专题、6 篇实战软件教程及 2 篇深度横向对比（`VS Code vs Sublime Text`、`7-Zip vs PeaZip`）。
9. **近期版本更新与新收录桌面软件双栏**  
   - **近期版本更新**：按原厂版本发布日 `releaseDate` 排序，严格按软件去重（避免单一软件多历史版本刷屏）。
   - **新收录桌面软件**：按平台首次上架时间 `catalogedAt` (`publishedAt || createdAt`) 排序，时间口径清晰分离。

---

## 四、后台频道运营配置中心 (`/admin/channel-software`)

- **Prisma 数据模型**：新增 `ChannelRecommendation`（[schema.prisma](server/prisma/schema.prisma)），支持 `HERO`、`WEEKLY_PICK`、`EDITOR_PICK`、`TOPIC_PICK`、`CATEGORY_PICK` 五大展位与 `sortOrder`、`isActive`、`startAt..endAt` 生效窗口。
- **后端安全约束**（[channelRoutes.ts](server/src/modules/channels/channelRoutes.ts)）：
  1. 鉴权拦截：必须具备 `EDITOR / REVIEWER / ADMIN / SUPER_ADMIN` 登录会话（未认证返回 `401`）；
  2. **审核不可绕过**：仅允许选择 `status === 'PUBLISHED' && isTestData === false && type !== 'GAME'` 的合法软件或已发布非测试专题/评测/教程（返回 `400 ONLY_PUBLISHED_NON_TEST_ALLOWED`）；目标软件后续若撤回草稿，公开接口实时自动屏蔽；
  3. **链接安全清洗**：封面地址拦截 `javascript:`、非 HTTPS、私有内网 SSRF 地址与目录穿越字符（返回 `400 UNSAFE_IMAGE_URL`）；
  4. **全程留痕**：每次增删改均写入 `AuditLog` 操作审计。
- **管理控制台页面**：已上线本地后台页面 `src/pages/admin/AdminChannelConfigPage.tsx` 及 `AdminLayout` 左侧导航「电脑软件频道运营」。

---

## 五、文件改动清单（仅局部频道与必要配套）

### 新增文件
- 后端：`server/src/modules/channels/softwareChannelService.ts`、`server/src/modules/channels/channelRoutes.ts`、`server/tests/p871SoftwarePortalTest.ts`
- 前端：`src/services/channelService.ts`、`src/components/software/softwareHelpers.ts`、`src/components/software/SoftwareCompactCard.tsx`、`src/components/software/SoftwarePortalHero.tsx`、`src/components/software/SoftwareHotCategoryGrid.tsx`、`src/components/software/SoftwareLeaderboards.tsx`、`src/components/software/SoftwareEditorialExtras.tsx`、`src/components/software/SoftwareCategoryShowcase.tsx`、`src/pages/admin/AdminChannelConfigPage.tsx`
- 文档：`docs/P871_SOFTWARE_BASELINE.md`、`docs/P871_DEPLOYMENT_PLAN.md`、`docs/P871_SOFTWARE_PORTAL_REPORT.md`

### 修改文件
- `server/prisma/schema.prisma`（新增 `ChannelRecommendation` 表）
- `server/src/app.ts`（注册 `channelRoutes`）
- `server/src/modules/categories/categoryRoutes.ts`（修复 `isTestData` 统计泄漏）
- `server/src/modules/resources/resourceRoutes.ts`（新增 `type=DESKTOP` 与 `sort=downloads`）
- `server/src/modules/seo/seoService.ts` & `seoRoutes.ts`（新增 `/software` SSR、Canonical、JSON-LD 与 Sitemap 条目）
- `src/pages/SoftwarePage.tsx`、`src/components/admin/AdminLayout.tsx`、`src/App.tsx`、`scripts/runAllQualityTests.ts`

---

## 六、实测检验结果汇总（全部真实执行）

### 6.1 TypeScript 与生产打包检查
- `npm run lint` (`tsc --noEmit`)：**0 错误通过**
- `npm run build` (`vite build`)：**728ms 成功构建全部 chunk**（含 `SoftwarePage` 与 `AdminChannelConfigPage`）

### 6.2 全阶段自动化回归测试 (`npx tsx scripts/runAllQualityTests.ts`)
- **总计 14 个测试套件全部通过：466 项通过 | 0 项失败**
  - P1 基础能力与接口：20 / 20 ✅
  - P2 商业化与会员：25 / 25 ✅
  - P2.1 支付与安全加固：31 / 31 ✅
  - P3 自动化运营与监控：45 / 45 ✅
  - P3.1 生产运维与安全整改：21 / 21 ✅
  - P4 增长与评测：40 / 40 ✅
  - P5 规模化与数据治理：45 / 45 ✅
  - P6 开发者与开放生态：65 / 65 ✅
  - P7 正式上线验收：62 / 62 ✅
  - P8 生产隔离与阻断整改：34 / 34 ✅
  - P8.5 全站体检与内测准备：16 / 16 ✅
  - P8.7 全站独立栏目与专题中心：15 / 15 ✅
  - **P8.7.1 电脑软件频道 UI 3.0：15 / 15 ✅**（聚合数据结构、真实榜排序、P3/草稿/测试/游戏隔离、权限 401、草稿推荐拦截、XSS/SSRF 图片拦截、生效/停用闭环、SSR HTML Canonical/JSON-LD）
  - P8.8 软件一键直链下载系统：32 / 32 ✅

### 6.3 真实 Chromium Playwright 多视口验收（9 / 9 全部通过）
- **1440×900 桌面浅色**：H1=`电脑软件频道`、频道头高度 `82px`、Canonical 精准指向 `/software`、**0 张断图**、**0 假数字**、0 横向溢出；
- **互动与状态闭环**：焦点图切换正常、点击「系统工具」即时展示真实筛选结果且重置正常；
- **1440×900 深色模式**：暗色背景 `rgb(13, 21, 36)`，卡片与对比度完整清晰；
- **全尺寸响应式**：`1024px` (`1024/1024`)、`768px` (`768/768`)、`430px` (`430/430`)、`390px` (`390/844` -> `390/390`) 均 **0 横向溢出**；
- **回归隔离**：首页 (`/`) 标题保持 `找软件 · 找游戏 · 找工具` 毫发无损，详情页 `/software/vscode` 正常访问；**0 Console 报错、0 Page 报错、0 非预期的 4xx/5xx 请求**；
- **服务端 SSR 实测**：`GET http://localhost:3001/software` 返回 HTTP `200` 及有效语义 HTML5。

### 6.4 视觉对比截图归档（Artifact 目录）
- 改版前：`p871_before_software.png`
- 改版后首屏：`p871_after_hero_1440.png`
- 改版后全页 (1440px)：`p871_after_software_1440.png`
- 深色模式 (1440px)：`p871_after_software_dark.png`
- 平板与手机响应式：`p871_after_software_768.png`、`p871_after_software_390.png`
- 首页无回归保留证明：`p871_homepage_preserved.png`
