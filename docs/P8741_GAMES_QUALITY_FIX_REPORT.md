# 软游部落 P8.7.4.1 —— 游戏中心 SEO、CLS 性能与测试数据治理专项修复报告

> **验收状态结论**：**`P8741_LOCAL_PASSED_WITH_WARNINGS`**
> **报告日期**：2026-11-10
> **工程环境**：`E:\Code\新建文件夹`（`http://localhost:3000/` + `http://localhost:3001/`）
> **正式环境边界**：本阶段严格遵守“仅在本地整改，禁止未经授权部署”原则，未修改任何生产配置、未上传文件、未重载生产 Nginx/PM2，亦未写入生产数据库。

---

## 1. 基线情况（P8.7.4.1 修复前实测状态）

详见基线归档报告 [P8741_BASELINE.md](file:///e:/Code/新建文件夹/docs/P8741_BASELINE.md)，核心基线问题如下：
1. **P1 — 游戏与全站 Sitemap 返回 HTML 或过期静态文件**：
   - 生产公网 `https://softtribe.top/sitemap-games.xml`（及 `-software`、`-categories`、`-topics`、`-tutorials`、`-comparisons`、`-developers`、`-community`）全部返回 `200 text/html`（4,037 字节前端 `index.html`）；
   - `https://softtribe.top/sitemap.xml` 命中静态 `public/sitemap.xml`（957 字节，指向失效域名 `https://soft.example.com/#featured`）；
   - 生产后端 `127.0.0.1:3008/sitemap-games.xml` 本身可生成正常 609 字节 `<urlset>` XML；问题出在 Nginx 与 Vite 代理缺少透传及静态 `public/sitemap.xml` 抢先占位。
2. **P2 — 游戏中心 `/games` 多视口 CLS 偏高（`0.1531–0.3885`）**：
   - 本地 Chrome `PerformanceObserver` 逐帧抓拍证实，7 组冷加载视口 CLS 介于 `0.1531`（1440px）至 `0.3885`（390px），超过 0.1 合格线及 0.25 严重线；
   - 站内客户端路由切换 `/` → `/games` CLS 为 `0.0000`。
3. **P2 — P5 数据完整率不达标与测试数据永久污染**：
   - 本地 PostgreSQL `Software` 表共 `132` 条记录：`93` 条正式资源（`30` PUBLISHED + `63` DRAFT，含 `fastcopy-extreme`）与 **`39` 条 `isTestData: true` 的历史 `test-tool-*` 残留**；
   - P5 原口径完整率为 `84 / 132 = 64%`（低于 `65%` 失败线），而正式资源真实完整率为 `84 / 93 = 90%`；同时库中累积 `topic-p3-*` `26` 条、`tut-p3-*` `26` 条。

---

## 2. 问题 1（P1）：Sitemap XML 与 Robots 代理修复详情

1. **清理失效静态文件**：删除 `public/sitemap.xml`（`soft.example.com`），重新构建后确认 `dist/sitemap.xml` 不再生成（`Test-Path dist/sitemap.xml` 为 `False`）。
2. **补齐 Vite 本地开发透传**：在 [vite.config.ts](file:///e:/Code/新建文件夹/vite.config.ts#L43-L50) 新增 `^/sitemap(-[a-z0-9-]+)?\\.xml$` 与 `/robots.txt` 至 `http://localhost:3001` 的代理规则。
3. **补齐生产 Nginx 代理模板**：在 [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf#L28-L37)（`443` 端口及 [第 126–135 行](file:///e:/Code/新建文件夹/softtribe.top.prod.conf#L126-L135) `8080` 端口）与 [softtribe.top.conf](file:///e:/Code/新建文件夹/softtribe.top.conf#L24-L33) 新增 `location ~* ^/(sitemap(-[a-z0-9-]+)?\.xml|robots\.txt)$` 转发至 `127.0.0.1:3008`。
4. **过滤测试残留与未发布项**：在 [seoRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts#L322-L350) 为 `/sitemap-topics.xml` 与 `/sitemap-tutorials.xml` 显式增加已发布状态约束，并排除 `topic-p3-`、`tut-p3-` 前缀。

### Sitemap / Robots 修复前后实测对照

| 端点路径 | 修复前（本地 Vite `localhost:3000`） | 修复后（本地 Vite `localhost:3000` 实测） | 当前生产公网（`https://softtribe.top`，未部署前） |
| :--- | :--- | :--- | :--- |
| `/sitemap-games.xml` | `200 text/html`（SPA 回退） | **`200 application/xml; charset=utf-8`**（`609` 字节，无 HTML，仅含 `/games` + 2 款已发布游戏） | **待部署修复**（仍由未重载的生产 Nginx 返回 `text/html`） |
| `/sitemap.xml` | 命中旧 `public/sitemap.xml`（`soft.example.com`） | **`200 application/xml; charset=utf-8`**（`1061` 字节 `<sitemapindex>`，含 8 张子表） | **待部署修复**（仍返回旧 `957` 字节 `soft.example.com` 文件） |
| `/sitemap-software.xml` | `200 text/html` | **`200 application/xml; charset=utf-8`**（`9967` 字节） | **待部署修复** |
| `/sitemap-topics.xml` / `-tutorials.xml` | `200 text/html`（后端未过滤 P3 前缀） | **`200 application/xml; charset=utf-8`**（`2176` / `5464` 字节，零 `topic-p3-`/`tut-p3-` 泄漏） | **待部署修复** |
| `/robots.txt` | 静态简单 7 行文件 | **`200 text/plain; charset=utf-8`**（`943` 字节完整爬虫协议与 9 条 Sitemap） | **待部署修复**（仍返回旧 `126` 字节文件） |

---

## 3. 问题 2（P2）：游戏中心（`/games`）CLS 偏移事件拆解与修复结果

### 3.1 `PerformanceObserver` 真实布局偏移归因
修复前在 `/games` 抓取每一条 `layout-shift` 事件证实：
- **主因（占 `99.5%+` CLS 值，`0.1524–0.3860`）**：`FOOTER.w-full.bg-[#142238].text-slate-400` 发生剧烈 `y` 坐标位移（`y: 486..677 -> 0` 移出视口）。原因在于 [src/App.tsx](file:///e:/Code/新建文件夹/src/App.tsx#L161-L166) 中 `React.lazy` 使用的全局 `PageLoadingFallback` 仅设 `min-h-[50vh]`，导致 `GamesPage` 异步分片下载期间页脚过早贴近屏幕中腰，分片挂载撑开内容时整块页脚瞬间下推造成高 CLS。
- **次要微移（`< 0.0025`）**：Header 品牌图标加载期间使 `SPAN.text-[17.5px]` / `NAV.hidden.xl:flex` 产生微弱像素对齐（`0.0002–0.0022`，水平 `y` 无变化）。

### 3.2 实施修复
1. 在 [src/App.tsx](file:///e:/Code/新建文件夹/src/App.tsx#L161-L166) 将 `PageLoadingFallback` 高度由 `min-h-[50vh]` 调整为 `min-h-[calc(100vh-64px)]`，为所有懒加载频道首屏预留完整视口高度，杜绝首屏页脚闪现及下推。
2. 在游戏中心图片组件显式补充 `width` / `height` HTML 属性以锁定固有比例盒模型：
   - [GamesPortalHero.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesPortalHero.tsx#L190-L191)（`width={1280} height={720}`，`width={64} height={40}`）
   - [GamesSpotlightGallery.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesSpotlightGallery.tsx#L62-L63)（`width={1280} height={720}`，`width={56} height={32}`）
   - [GamesEditorialAndUpdates.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesEditorialAndUpdates.tsx#L60-L61)（`width={640} height={360}`）
   - [GamesCatalogSection.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesCatalogSection.tsx#L242-L243)（`width={640} height={360}`）

### 3.3 多视口 CLS 修复前后对比实测（`http://localhost:3000/games`）

| 测试视口与模式 | 修复前 CLS | 修复后 CLS（最新实测） | 修复后刷新 Reload CLS | 修复后 FCP / LCP | 水平溢出 / 破图数 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `1440x900` 亮色冷启动 | `0.1531` | **`0.0006`** | `0.0006` | `392ms` / `1028ms` | `false` / `0` (`18/18`) | 达标（降幅 99.6%） |
| `1440x900` 深色冷启动 | `0.1531` | **`0.0006`** | — | `260ms` / `688ms` | `false` / `0` (`18/18`) | 达标（降幅 99.6%） |
| `1280x800` 亮色冷启动 | `0.2230` | **`0.0008`** | — | `268ms` / `688ms` | `false` / `0` (`18/18`) | 达标（降幅 99.6%） |
| `1024x768` 亮色冷启动 | `0.3017` | **`0.0002`** | — | `256ms` / `692ms` | `false` / `0` (`18/18`) | 达标（降幅 99.9%） |
| `768x1024` 平板冷启动 | `0.1940` | **`0.0002`** | — | `252ms` / `692ms` | `false` / `0` (`18/18`) | 达标（降幅 99.9%） |
| `430x932` 手机冷启动 | `0.3356` | **`0.0003`** | — | `240ms` / `680ms` | `false` / `0` (`18/18`) | 达标（降幅 99.9%） |
| `390x844` 小屏冷启动 | `0.3885` | **`0.0022`** | **`0.0000`** | `236ms` / `660ms` | `false` / `0` (`18/18`) | 达标（降幅 99.4%） |
| `1440x900` 站内导航 `/` → `/games` | `0.0000` | **`0.0000`** | — | — | `false` | 达标 |

> 全部 7 项视口与 2 项硬刷新、1 项站内切换测得 **最大 CLS = `0.0022`**，远优于 Google CWV 优秀线（`<= 0.1`）与目标（`< 0.05`）。

---

## 4. 问题 3（P2）：P5 数据完整率治理与口径修复

1. **治理服务口径修正**：修改 [governanceService.ts](file:///e:/Code/新建文件夹/server/src/modules/governance/governanceService.ts#L181-L205) 的 `getGovernanceMetrics()`，引入 `const officialWhere = { isTestData: false }` 覆盖 `totalResources`、`publishedCount`、`draftCount` 及六项完整性状态统计。
2. **修复前后指标对照**：
   - 修复前（含 `39` 条 `isTestData: true` 污染样本）：`84 / 132 = 64%`（低于 P5 要求 `>= 65%`）；
   - 修复后（排除测试样本并清理本地历史泄漏后）：`84 / 92 = 91%`（`30` 款已发布正式资源 + `62` 款草稿队列；`8` 款真实处于 `VERIFIED_INCOMPLETE` 的已发布软件包含 `peazip`、`sublime-text`、`rufus`、`geek-uninstaller`、`git`、`diskgenius`、`mindustry`、`vscode`，保留真实核验状态不造假；游戏保持 **2 PUBLISHED + 8 DRAFT**）。

---

## 5. 测试隔离修复与本地测试脏数据清理记录

1. **清理前强制逻辑备份**：
   - 已在清理前通过 `pg_dump` 导出本地数据库逻辑快照至 [local_pre_p8741_cleanup_2026-11-10T08-09-06-601Z.dump](file:///e:/Code/新建文件夹/backups/local_pre_p8741_cleanup_2026-11-10T08-09-06-601Z.dump)（`465,076` 字节）。
2. **本地确认清理对象（仅本地数据库，未触及生产库）**：
   - `39` 条历史测试软件 `test-tool-*`（均为 `isTestData: true`，来自 `apiTest.ts`）；
   - `1` 条残留草稿 `fastcopy-extreme`（来自 `p3OperationsTest.ts`）；
   - `26` 条 `topic-p3-*` 与 `26` 条 `tut-p3-*`（来自 `p3OperationsTest.ts`）；
   - `35` 条 `vscode` 合成版本号 `1.99.*` 测试版本及关联候选（清理后已复查确认 `vscode` 真实最新版本为 `1.96.2` 且 `isLatest: true` 完好保留）。
3. **测试套件收口隔离改造（彻底消除再次运行污染）**：
   - [apiTest.ts](file:///e:/Code/新建文件夹/server/tests/apiTest.ts#L257-L263)：补充 `finally` 清理创建的 `createdSoftwareId` 与对应 `auditLog`；
   - [p3OperationsTest.ts](file:///e:/Code/新建文件夹/server/tests/p3OperationsTest.ts#L480-L502)：补充清理 `createdTutorialSlug`、`testTopicId`、`fastcopy-extreme`、`testBatchId`、`candidateId`、合成版本号并还原 `prevLatestVersionId` 的 `isLatest: true` 及清理 `log403Id`。
4. **全量运行后复查零泄漏证明**：
   - 在最新完整执行 18 套全量自动化测试后立即复查本地数据库，实测结果严格为：`totalSoftware: 92`、`nonTestCount: 92`、**`isTestCount: 0`**、`fastcopyExtremeCount: 0`、`topicP3Count: 0`、`tutP3Count: 0`、`p3Users: 0`，证明全量测试零泄漏复发。

---

## 6. 完整修改文件清单与变更说明

| 类别 | 文件路径 | 修改性质 | 变更说明 |
| :--- | :--- | :--- | :--- |
| 静态清理 | `public/sitemap.xml` | 删除 | 删除指向失效域名 `soft.example.com` 的静态文件，防止覆盖动态 Sitemap |
| Nginx 模板 | [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf) | 修改 | 为 `443` 与 `8080` 端口添加 `location ~* ^/(sitemap(-[a-z0-9-]+)?\.xml\|robots\.txt)$` 代理至 `127.0.0.1:3008` |
| Nginx 模板 | [softtribe.top.conf](file:///e:/Code/新建文件夹/softtribe.top.conf) | 修改 | 同步在 `location /` 前补齐 Sitemap/Robots 代理规则 |
| Vite 代理 | [vite.config.ts](file:///e:/Code/新建文件夹/vite.config.ts) | 修改 | 开发环境代理补齐 `^/sitemap(-[a-z0-9-]+)?\\.xml$` 与 `/robots.txt` 至 `http://localhost:3001` |
| 首屏防偏移 | [src/App.tsx](file:///e:/Code/新建文件夹/src/App.tsx) | 修改 | `PageLoadingFallback` 由 `min-h-[50vh]` 改为 `min-h-[calc(100vh-64px)]`，消除首屏 Footer 跃迁 CLS |
| 图片尺寸 | [GamesPortalHero.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesPortalHero.tsx) | 修改 | 焦点大图与侧栏缩略图补充 `width`/`height` HTML 属性 |
| 图片尺寸 | [GamesSpotlightGallery.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesSpotlightGallery.tsx) | 修改 | 实机截图大图与缩略切换图补充 `width`/`height` HTML 属性 |
| 图片尺寸 | [GamesEditorialAndUpdates.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesEditorialAndUpdates.tsx) | 修改 | 编辑/列表游戏卡片封面补充 `width={640} height={360}` |
| 图片尺寸 | [GamesCatalogSection.tsx](file:///e:/Code/新建文件夹/src/components/games/GamesCatalogSection.tsx) | 修改 | 分类目录卡片图片补充 `width={640} height={360}` |
| 后端 SEO | [seoRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts) | 修改 | `/sitemap-topics.xml`、`/sitemap-tutorials.xml` 增加已发布过滤并排除 `topic-p3-`/`tut-p3-` 测试前缀 |
| 数据治理 | [governanceService.ts](file:///e:/Code/新建文件夹/server/src/modules/governance/governanceService.ts) | 修改 | `getGovernanceMetrics()` 全局加入 `{ isTestData: false }` 过滤条件 |
| 测试隔离 | [apiTest.ts](file:///e:/Code/新建文件夹/server/tests/apiTest.ts) | 修改 | `finally` 回收测试新建软件与审计日志 |
| 测试隔离 | [p3OperationsTest.ts](file:///e:/Code/新建文件夹/server/tests/p3OperationsTest.ts) | 修改 | 用例结束回收测试专题、教程、草稿软件、版本候选与恢复真实最新版本号 |
| 专项测试 | [p8741GamesQualityFixTest.ts](file:///e:/Code/新建文件夹/server/tests/p8741GamesQualityFixTest.ts) | 新增 | 8 项 P8.7.4.1 Sitemap XML、CLS 防护、P5 完整率、零测试残留与零回归契约验证 |
| 回归注册 | [runAllQualityTests.ts](file:///e:/Code/新建文件夹/scripts/runAllQualityTests.ts) | 修改 | 将 `P8.7.4.1 游戏专项质量修复` 纳入 18 项全量回归总调度 |
| 审计与文档 | [P8741_BASELINE.md](file:///e:/Code/新建文件夹/docs/P8741_BASELINE.md)、[P8741_DEPLOYMENT_PLAN.md](file:///e:/Code/新建文件夹/docs/P8741_DEPLOYMENT_PLAN.md)、[P8741_GAMES_QUALITY_FIX_REPORT.md](file:///e:/Code/新建文件夹/docs/P8741_GAMES_QUALITY_FIX_REPORT.md) | 新增 | 基线审计、生产部署/回滚方案及本验收报告 |

---

## 7. 游戏中心与全站 SEO 状态核查

- **游戏数据保护边界**：本地库全部 `10` 款 `GAME` 资源保持不变——仅 `2` 款 `PUBLISHED`（见 [seoRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts#L280-L301) 查询过滤后的 `mindustry` `Mindustry (像素工厂)`、`supertuxkart` `SuperTuxKart`），其余 `8` 款（`0ad`、`battle-for-wesnoth`、`endless-sky`、`luanti-minetest`、`openra`、`openttd`、`shattered-pixel-dungeon`、`warzone2100`）全部保持 `DRAFT`。
- **本地 Sitemap 游戏明细（`http://localhost:3000/sitemap-games.xml` 实测）**：精确输出 3 条 URL——`/games`（`priority 0.95`）、`/game/mindustry`（`priority 0.85`）、`/game/supertuxkart`（`priority 0.85`）；严格不泄露草稿游戏与任何测试记录。
- **页面级 SEO 元素（`/games`）**：H1 为 `精品独立与开源 PC 游戏中心`；Canonical 正常指向 `/games`；`robots.txt` 包含 `Allow: /games` 与全部 9 个 Sitemap；生产域名对应 XML 将随上线部署生效。

---

## 8. 真实浏览器与视觉验收结果（Playwright Chromium）

最新通过 `http://localhost:3000/` 完成全站 9 大公开路由回归与截图对比检查（均无 JS 异常与图片破损）：

| 路由 | HTTP | Title 与独立 H1 核查 | 正文字符数 | 水平溢出 | 破损图片 | JS 报错 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `200` | `找软件 · 找游戏 · 找工具` | `5155` | `false` | `0` | `[]` |
| `/software` | `200` | `电脑软件频道` | `8127` | `false` | `0` | `[]` |
| `/system-tools` | `200` | `专业电脑维护与系统工具中心` | `10073` | `false` | `0` | `[]` |
| `/games` | `200` | `精品独立与开源 PC 游戏中心` | `3352` | `false` | `0` | `[]` |
| `/essentials` | `200` | `电脑装机必备软件方案` | `1369` | `false` | `0` | `[]` |
| `/compare` | `200` | `软件横向对比与客观选型指南` | `816` | `false` | `0` | `[]` |
| `/community` | `200` | `软游部落用户社区与经验交流` | `739` | `false` | `0` | `[]` |
| `/tutorials` | `200` | `软件教程与实用技巧中心` | `2074` | `false` | `0` | `[]` |
| `/updates` | `200` | `软件版本更新与发布动态` | `5570` | `false` | `0` | `[]` |

**本地截图视觉对比证据链**：
- 修复前基线：`C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p8741_before_games_1440.png`、`p8741_before_games_390.png`
- 修复后游戏中心：`p8741_after_games_1440.png`、`p8741_after_games_dark_1440.png`、`p8741_after_games_390.png`
- XML Sitemap 证据：`p8741_sitemap_xml_evidence.png`
- 已保真频道回归截图：`p8741_homepage_preserved.png`、`p8741_software_preserved.png`、`p8741_system_tools_preserved.png`

---

## 9. 全阶段自动化构建与回归测试实测（如实呈现全部结果）

1. **TypeScript 类型检查与前端构建**：
   - `npx tsc --noEmit`：0 错误退出；
   - `npm run build`：1,771 模块打包完成（`3.76s`），生成 `dist/index.html`、`GamesPage-rGmoIzpq.js` 等全部产物，且确认 `dist/sitemap.xml` 不存在。
2. **18 项全量自动化测试最新执行汇总（`npx tsx scripts/runAllQualityTests.ts`）**：
   - 合计：**`16 / 18` 套件全部通过（累计 `378` 项断言 PASS），`2 / 18` 套件未通过（共 `2` 项套件级失败，源自 P6/P7 历史固定总行数断言）**。

| 序号 | 测试套件 | 通过 | 失败 | 状态 | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | P1 基础能力与接口 | 20 | 0 | ✅ PASS | 测试后已自动清理临时数据 |
| 2 | P2 商业化与会员 | 25 | 0 | ✅ PASS | — |
| 3 | P2.1 支付与安全加固 | 31 | 0 | ✅ PASS | — |
| 4 | P3 自动化运营与监控 | 45 | 0 | ✅ PASS | 测试后已自动清理专题/教程/草稿与还原最新版本号 |
| 5 | P3.1 生产运维与安全整改 | 21 | 0 | ✅ PASS | — |
| 6 | P4 增长与评测 | 40 | 0 | ✅ PASS | — |
| 7 | **P5 规模化与数据治理** | **45** | **0** | **✅ PASS** | 完整率口径隔离 `isTestData: false` 后稳定 `91% >= 65%` |
| 8 | **P6 开发者与开放生态** | 0 | 1 | **❌ ERROR** | 详见下述真实基线冲突（未篡改断言） |
| 9 | **P7 正式上线验收** | 0 | 1 | **❌ ERROR** | 详见下述真实基线冲突（未篡改断言） |
| 10 | P8 生产隔离与阻断整改 | 34 | 0 | ✅ PASS | — |
| 11 | P8.5 全站体检与内测准备 | 16 | 0 | ✅ PASS | — |
| 12 | P8.7 全站独立栏目与专题中心 | 15 | 0 | ✅ PASS | — |
| 13 | P8.7.1 电脑软件频道 UI 3.0 | 15 | 0 | ✅ PASS | — |
| 14 | P8.7.2 电脑软件频道质量精修 | 12 | 0 | ✅ PASS | — |
| 15 | P8.7.3 系统工具频道 UI 3.0 | 11 | 0 | ✅ PASS | — |
| 16 | P8.7.4 游戏中心 UI 3.0 | 8 | 0 | ✅ PASS | — |
| 17 | **P8.7.4.1 游戏专项质量修复** | **8** | **0** | **✅ PASS** | 新增 Sitemap/CLS/P5/零泄漏专项契约全过 |
| 18 | P8.8 软件一键直链下载系统 | 32 | 0 | ✅ PASS | — |

### 9.1 P6 / P7 失败原因客观技术剖析（严守“禁止修改断言使其通过”准则）
- [p6EcosystemTest.ts](file:///e:/Code/新建文件夹/server/tests/p6EcosystemTest.ts#L56-L62) 与 [p7LaunchReadinessTest.ts](file:///e:/Code/新建文件夹/server/tests/p7LaunchReadinessTest.ts#L140-L143) 在早期阶段写入了未排除测试数据的原始表总行数硬编码断言：
  - `P6` 断言 `totalResources >= 97`、`publishedCount >= 34`、`draftCount >= 63`（实际洁净库为 `92`、`30`、`62`）；
  - `P7` 断言 `draftCount === 63`、`publishedCount >= 34`（实际洁净库为 `62`、`30`）。
- 历史之所以凑足 `97+ / 34+ / 63`，正因早前 `apiTest`（`test-tool-*`, `PUBLISHED`, `isTestData: true`）与 `p3OperationsTest`（`fastcopy-extreme`, `DRAFT`）长期遗留在数据库内未被清理；本次将确认的历史测试脏数据规范清理归零后，洁净库恢复为 `92` 款非测试正式资源（`30` PUBLISHED + `62` DRAFT），于是该两处历史遗留断言如实暴露。由于本轮规范明确**不得仅修改测试断言使其通过**，两份测试文件已原封不动保留并在本报告中如实披露。

---

## 10. 生产安全与零改动合规证明

- **本地仅此环境**：本次所有修改、数据库备份、清理与 Playwright 验证均发生在本地工作区 `E:\Code\新建文件夹` 及本地 `localhost:5432/softbuluo`。
- **生产零侵入**：自发现问题并记录基线后，严格未向 `134.175.230.107` 上传任何文件、未编辑 `/etc/nginx/sites-available/softtribe.top.conf`、未执行 `nginx -s reload` 或 `pm2 reload`、未触碰生产数据库。

---

## 11. 遗留与待决议问题清单

1. **生产公网 Sitemap & 前端 CLS 待发布上线**：[softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf) 的 Nginx 反代变更与新构建 `dist/`（含删除远程 `dist/sitemap.xml` 与 `App.tsx` CLS 修复）尚未部署到 `https://softtribe.top/`，等待用户授权发布后方可从“生产待修复”变为公网生效。
2. **P6 / P7 历史硬编码总行数断言待后续立项统一基线**：待团队决定将 `p6EcosystemTest.ts` / `p7LaunchReadinessTest.ts` 同步校准为 `isTestData: false` 的真实非测试基准（`>= 92` / `>= 30` / `>= 62`）或通过真实人工审核补齐资源增量，不得盲目放宽断言掩盖问题。
3. **8 款已发布资源暂维持 `VERIFIED_INCOMPLETE`**：包含游戏 `mindustry` 及 7 款常用工具（`peazip`、`sublime-text`、`rufus`、`geek-uninstaller`、`git`、`diskgenius`、`vscode`）因历史未采集齐全安装包 SHA-256 等字段，继续保持诚实状态展示。
4. **生产库历史 `isTestData` 检查（待发布时只读排查）**：待授权上线时需只读排查生产数据库是否存在过早先测试遗留样本并确认是否需要独立清洗批文。

---

## 12. 生产部署计划指引

完整预检查、静态清理、Nginx 精确 Diff 合成与公网逐项冒烟脚本已编写于 [P8741_DEPLOYMENT_PLAN.md](file:///e:/Code/新建文件夹/docs/P8741_DEPLOYMENT_PLAN.md)。

---

## 13. 回滚方案与最终总结

- 若生产发布 Nginx 规则后出现异常，可直接还原 `.bak.p8741` Nginx 备份并 `nginx -t && nginx -s reload`（零应用数据影响）；若代码层面异常，仅回退 `dist/` 与 `server/` 构建包并 `pm2 reload`（零数据库还原需求）。
- **最终结论**：**`P8741_LOCAL_PASSED_WITH_WARNINGS`**——P8.7.4.1 三项核心质量隐患已在本地完成根因修复与真实多视口/全套验证（`CLS <= 0.0022`、本地 Sitemap XML 无回退且精准过滤、P5 口径完整率 `91%` 且全套回归后实现 **0 条测试污染残留**）；因生产 Nginx 与代码尚未获批上线，以及遵循规范未擅自改动 P6/P7 历史脏数据行数快照断言，特以警告通过状态交付等待您的上线审阅与指令。
