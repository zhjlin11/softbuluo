# 软游部落 P8.7.4 游戏中心 (`/games`) UI 3.0 本地验收报告

> **总结论状态：`P874_PRODUCTION_SYNCED_AND_VERIFIED`（本地质量：`P874_LOCAL_PASSED_WITH_WARNINGS`）**
> **生产发布与验收实录**：已获明确部署授权并将代码、构建产物及静态资产同步至生产服务器 `134.175.230.107` (`/var/www/softtribe.top`)，公网域名 `https://softtribe.top/games` 真浏览器核验通过。

---

## 一、交付物与代码变更清单

### 1.1 新增 / 更新模块与静态资源
| 类别 | 文件路径 | 核心职责与变更说明 |
| :--- | :--- | :--- |
| 基线盘点文档 | `docs/P874_GAME_BASELINE.md` | 实查数据库 10 条 `GAME` 记录（2 已发布 / 8 草稿）、专题教程及改造前页面缺陷 |
| 发布回滚预案 | `docs/P874_DEPLOYMENT_PLAN.md` | 明确区分纯代码变更、无破坏性 Schema 变更及「策略 A 仅代码回滚 / 策略 B 数据库运营配置恢复」 |
| 游戏频道聚合服务 | `server/src/modules/channels/gamesChannelService.ts` | 提供 `/api/v1/channels/games` 聚合逻辑：只收录 `PUBLISHED` 非测试游戏、按真实题材聚合（空题材折叠）、分离 `OBS Studio`/`VLC` 游戏配套工具、过滤关联草稿游戏的攻略教程、诚实低样本榜单及真实更新时间戳 |
| 频道校验与路由 | `server/src/modules/channels/softwareChannelService.ts`、`server/src/modules/channels/channelRoutes.ts` | `ALLOWED_CHANNELS` 扩展 `'GAMES'`，`validateChannelTarget` 严格阻止草稿/测试/非游戏软件进入 `GAMES` 主推荐位；`/candidates` 为 `GAMES` 仅列出已发布 `GAME` |
| 资源多维筛选增强 | `server/src/modules/resources/resourceRoutes.ts` | `/api/v1/resources` 新增 `genre` 关键字/映射过滤、兼容 `supportedPlatforms` 跨平台过滤（修复 `macOS`/`Linux` 过滤失效），并在摘要 DTO 中附带 `coverUrl`、`genre`、`distributionPlatform`、`priceType` 与 `s.licenseType` 回退 |
| SSR 与 SEO 接入 | `server/src/modules/seo/seoService.ts`、`server/src/modules/seo/seoRoutes.ts`、`public/robots.txt` | 新增 `GET /games` 服务端语义 HTML 与 JSON-LD `CollectionPage`、`canonical` 指向 `${clientUrl}/games`；`/sitemap-games.xml` 收录 `/games`；`/robots.txt` 与 `public/robots.txt` 增加 `Allow: /games` |
| 游戏视觉横幅资产 | `public/images/games/hero-indie-collection.svg`、`public/images/games/hero-game-safety.svg` | 显式声明 `width="960" height="540"` 的原创专题安全视觉 SVG 资产；并沿用既有 `public/images/games/{mindustry,supertuxkart}-*.jpg` 实机截图 |
| 前端类型与服务 | `src/types/resource.ts`、`src/services/channelService.ts`、`src/components/software/SoftwareLeaderboards.tsx`、`src/pages/admin/AdminChannelConfigPage.tsx` | 扩展 `GamesChannelData` 与 `getGamesChannelPortal` / `getGamesResourcesList`；修复排行榜组件在 `type === 'GAME'` 时跳转 `/game/:slug`；后台频道运营新增「游戏中心频道 (`/games`)」标签 |
| 游戏门户 UI 3.0 | `src/components/games/GamesPortalHero.tsx`、`GamesSpotlightGallery.tsx`、`GamesTaxonomyAndTools.tsx`、`GamesEditorialAndUpdates.tsx`、`GamesCatalogSection.tsx`、`src/pages/GamesPage.tsx` | 全新五段式游戏门户：紧凑统计头 + 真实题材条 + 焦点大图轮播 + 多截图切换/灯箱鉴赏 + 配套工具隔离区 + 诚实榜单与专题攻略 + 自适应多维资源检索库；动态写入 `/games` Canonical |
| P8.7.4 自动化测试 | `server/tests/p874GamesPortalTest.ts`、`scripts/runAllQualityTests.ts` | 新增 8 项专项验收断言并纳入全站 17 套件质量测试目录 |

---

## 二、真实性、安全与内容隔离核查（已实测通过）

1. **严格游戏样本隔离（不注水、不批量转正草稿）**：
   - 数据库实查共 10 条 `GAME` 记录：仅 `Mindustry (像素工厂)` 与 `SuperTuxKart` 为 `PUBLISHED`；`OpenTTD`、`Shattered Pixel Dungeon`、`0 A.D.`、`Battle for Wesnoth`、`Endless Sky`、`Warzone 2100`、`Luanti`、`OpenRA` 共 8 款保持 `DRAFT`，前台、API、SSR HTML 与 Sitemap 均严格排除草稿与测试数据。
2. **配套工具严格单列（不冒充游戏总数）**：
   - `OBS Studio`（60FPS 游戏录屏与实况推流）与 `VLC`（本地录像回放）仅展示于独立「游戏配套辅助软件」栏位并明确标注「非游戏本体」，链接指向 `/software/:slug`，不计入游戏总数量与游戏榜单。
3. **来源真伪与版本修复（消除失实宣传）**：
   - 清理了旧版写死的虚假文案 `无捆绑 · 无内置充值 · 官方原厂哈希` 及版本号双前缀 `vv146` 缺陷；对于目前 `sha256 === null` 且 `reviewStatus === 'PENDING'` 的外部官方下载页来源，页面如实展示「官方下载引导页（尚未实机哈希校验）」。
4. **专题计数与攻略去风险**：
   - 专题 `open-source-games-collection` 动态统计并仅展示其已发布游戏数量（`1` 款）与诚实提示，避免误报 `6` 款或泄露草稿名；关联草稿 `openra` 的教程在前台攻略列表自动屏蔽，仅展示已公开的 `OBS Studio` 录屏调优指南与通用 `SHA-256` 校验指南。
5. **非盗版/外挂底线**：
   - 频道全量说明拒绝任何盗版破解、修改器与诱导向内购第三方端。

---

## 三、本地测试与浏览器验收真实记录

> 以下数据均于最终代码修改完成后实地执行测得：

### 3.1 编译构建与 `P8.7.4` 专项测试
- `npx tsc --noEmit`：通过（0 错误）
- `npm run build`：`vite build` 成功完成（产物含 `dist/assets/GamesPage-C...js` 等，无错误）
- `npx tsx server/tests/p874GamesPortalTest.ts`：**8 / 8 项 PASS（0 失败）**
  - 覆盖 `/api/v1/channels/games` 聚合数量、本地封面资产、辅助工具隔离、诚实榜单、草稿/测试数据拦截；`/api/v1/resources?type=GAME` `genre`/`platform`/`license`/`search` 精准过滤；后台 `GAMES` 401/403 越权拦截、400 非游戏与草稿拦截及跨频道（`SOFTWARE`/`SYSTEM_TOOLS`）零污染；`/games` SSR、`/sitemap-games.xml`、`/robots.txt` 校验。

### 3.2 全站 17 套回归测试执行结果（`npx tsx scripts/runAllQualityTests.ts`）
- **16 / 17 套件通过，累计通过 452 项**（`P1`、`P2`、`P2.1`、`P3`、`P3.1`、`P4`、`P6`、`P7`、`P8`、`P8.5`、`P8.7`、`P8.7.1`、`P8.7.2`、`P8.7.3`、`P8.7.4`、`P8.8` 全数 `0` 失败）。
- **唯一非零退出的存量告警套件（非 P8.7.4 引入）**：
  - `P5 规模化与数据治理` 单独执行结果为 `44 PASS / 1 FAIL`（总控汇总表因进程非零退出记 `0 / 1 ❌ ERROR`），失败项为：`[FAIL] 要素完整率达标: 64%`（阈值 `>= 65%`）。
  - 数据库实查根因：历史多轮 P3 自动化测试运行在本地库累计生成 38 条未自动清理的 `isTestData: true` 记录（`test-tool-*`），致使 `verifiedCompleteCount(84) / totalResources(131) = 64.12%`，与 P8.7.4 代码及游戏数据无关。

### 3.3 Playwright 真实浏览器与多端回归验收（最终 edit 后实测）
| 测试视口 | Title / H1 | Canonical | 横向溢出 (`overflowX`) | 图片总数 / 破损图 | JS/控制台/非白名单HTTP错 | FCP / LCP | CLS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `1440x900` (亮色) | 正确 (`精品独立与开源 PC 游戏中心`) | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `452ms / 848ms` | `0.1531` |
| `1440x900` (深色) | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `292ms / 700ms` | `0.1531` |
| `1280x800` | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `272ms / 692ms` | `0.223` |
| `1024x768` | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `252ms / 680ms` | `0.3017` |
| `768x1024` | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `256ms / 732ms` | `0.194` |
| `430x932` (手机) | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `252ms / 676ms` | `0.3356` |
| `390x844` (小屏) | 正确 | `http://localhost:3000/games` | `false` | `18 / 0` | `0 / 0 / 0` | `244ms / 668ms` | `0.4267` |

- **交互验收全通过**：首页顶部导航 `#nav-games` 点击进入 `/games`、Hero 焦点轮播切换（`Mindustry` 切换 `SuperTuxKart`）、实机缩略图切换（`2 / 3`）、大图灯箱弹窗开关、题材过滤「3D 竞速与娱乐」仅显示 `SuperTuxKart`、无匹配关键词触发空态及「重置筛选条件」恢复 `2` 款。
- **零回归频道实测完好**：`/`（首页 `H1: 找软件 · 找游戏 · 找工具`，`overflowX: false`）、`/software`（`H1: 电脑软件频道`，`overflowX: false`）、`/system-tools`（`H1: 专业电脑维护与系统工具中心`，`overflowX: false`）。

---

## 四、已知告警与后续建议

1. **历史测试样本清理与 P5 完整率恢复（非本阶段缺陷）**：建议上线验收前另行清理本地测试库中早期 P3 遗留的 38 条 `test-tool-*` 冗余行，使 `P5` `completenessRate` 恢复至 `>= 65%` 通过线；或将 P5 完整率计算口经排除 `isTestData = true` 测试样本。
2. **首屏 `CLS` 优化观察**：由于全局 `App.tsx` 采用 `React.lazy` + `Suspense` 全局紧凑占位壳（本次严禁修改公共外壳 `App.tsx`），浏览器冷加载 `/games` 时从 `Suspense` fallback 切换至页面内容产生 `CLS 0.153–0.427` 偏移；后续如统一升级路由 `Suspense` 骨架占位高或生产启用服务端预渲染配合静态首屏，可进一步压低全站懒加载路由 CLS。
3. **游戏渠道核验与待发布草稿**：当前 2 款已发布游戏暂无实机 `SHA-256` 哈希校验，且另 8 款开源游戏仍处于 `DRAFT`。如需丰富游戏中心品类，后续可在后台逐一补齐下载源实机检测与哈希核验后再审校发布，页面所有题材板块与榜单将自动扩展展示。

---

## 五、已授权生产部署实录（2026-11-10）

1. **前置双备份凭证（`/home/ubuntu/backups/`）**：
   - 数据库逻辑全备：`/home/ubuntu/backups/softbuluo_pre_p874_20261110_155215.dump`（`250K`，Docker `vasto-postgres`）
   - 代码与构建归档：`/home/ubuntu/backups/softtribe_code_pre_p874_20261110_155215.tar.gz`（`16M`）
2. **线上原子同步与后端重载**：
   - 原子更新 `/var/www/softtribe.top/dist`（含 `/images/games/*.jpg`、`hero-*.svg`、`robots.txt`）、后端模块 `server/src/modules/{channels,resources,seo}/` 及前端 `src/`；无数据库结构迁移、未改动 8 款 `DRAFT` 游戏状态。
   - 重载 `pm2 reload softtribe-backend --update-env` 成功：`status=online`，`http://127.0.0.1:3008/api/v1/health` 返回 `HEALTHY` (`CONNECTED`)；`http://127.0.0.1:3008/games` SSR 返回 `HTTP 200` 及 `<link rel="canonical" href="https://softtribe.top/games">`；`https://softtribe.top/robots.txt` 返回 `Allow: /games`；`https://softtribe.top/api/v1/channels/games` 返回 `200`（`totalGamesCount: 2`, `registeredSourcesCount: 2`, `companionToolsCount: 2`, `topicsCount: 1`, `guidesCount: 2`, `draftQueueCount: 8`）。
   - 注：生产 Nginx `softtribe.top.conf` 目前仅将 `/api/` 代理至后端 `3008`，故公网 `/sitemap-games.xml` 由前端 `try_files` 回落 `index.html`，后端 `http://127.0.0.1:3008/sitemap-games.xml` 已就绪输出完整 XML（包含 `/games` 及已发布游戏页）。
3. **公网真实浏览器核验（服务器本机 Google Chrome `146.0.7680.164` 直连 `https://softtribe.top/games`）**：
   - **1440px 浅色模式**：`title` 与 `<h1>精品独立与开源 PC 游戏中心</h1>` 正确，`canonical` 为 `https://softtribe.top/games`，`18/18` 图片 0 破损，`overflowX: false`；`Prod` 库实测展示「近期关注度动态（实有 2 条记录：`Mindustry` 8 次浏览、`SuperTuxKart` 2 次浏览）」及「近期下载点击动态（实有 1 条记录：`SuperTuxKart` 1 次触发）」。
   - **1440px 交互与筛选**：截图缩略图切换 (`2 / 3`) 与「3D 竞速与娱乐」筛选均正常；`0` 页内 JS 报错、`0` 控制台错误、`0` 非白名单 HTTP 异常。
   - **1440px 深色模式与 390px 移动端**：`isDark: true`、`overflowX: false`、`brokenImages: 0`。
   - **零回归保护验证**：公网 `/`、`/software`、`/system-tools` 全部保持 `overflowX: false` 与原版布局完好；验收截图已归档至 Artifact 目录 `prod_p874_games_{hero_1440,1440,dark_1440,390}.png` 及 `prod_p874_{homepage,software,system_tools}_preserved.png`。
