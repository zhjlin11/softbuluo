# 软游部落 P8.7.4.1 —— 游戏中心 SEO、CLS 性能与测试数据治理专项基线报告

> **基线审计时间**：2026-11-10 16:05 (UTC+8)
> **工程环境**：`E:\Code\新建文件夹`（分支 `main`，生产域名 `https://softtribe.top/`）
> **基线审计原则**：严格基于本地源码、本地真实 Chromium `PerformanceObserver` 探针、只读 SQL 统计及生产服务端 Nginx 只读抽检记录客观事实；本阶段尚未改动任何生产配置或业务数据。

---

## 一、Git 状态与未提交工作区记录

- 当前分支：`main`
- 工作区存在未提交的历史及 P8.7.4 相关改动：核心涉及 `index.html`、`public/robots.txt`、`vite.config.ts`、`src/App.tsx`、`src/pages/*`、`src/components/{games,software,systemTools,home,layout,common}/*`、`server/src/*`、`server/tests/*`、`scripts/*`、`docs/*`、`softtribe.top*.conf`。

---

## 二、问题 1（P1）：游戏 Sitemap 返回 HTML 而不是 XML 的实测基线

### 2.1 公网生产环境（只读验证结果，未改动线上）
对 `https://softtribe.top` 逐一执行 `curl -sS -D -` 检查真实响应头与正文：

| URL 路径 | 实际 HTTP | Content-Type | 响应字节 | 正文类型与问题 |
| :--- | :--- | :--- | :--- | :--- |
| `https://softtribe.top/sitemap.xml` | `200` | `text/xml` | `957` | **严重异常**：命中静态旧文件 `public/sitemap.xml`（包含无效占位域名 `https://soft.example.com/#featured` 等），未转发到后端动态索引 |
| `https://softtribe.top/sitemap-games.xml` | `200` | `text/html` | `4037` | **HTML 回退**：被 Nginx `try_files $uri $uri/ /index.html` 捕获并返回 `<!doctype html>` |
| `https://softtribe.top/sitemap-software.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-categories.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-topics.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-tutorials.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-comparisons.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-developers.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/sitemap-community.xml` | `200` | `text/html` | `4037` | **HTML 回退**（同上） |
| `https://softtribe.top/robots.txt` | `200` | `text/plain` | `126` | 命中静态 `public/robots.txt`，缺少全部 8 个分站 Sitemap 指引与后台抓取禁止规则 |

### 2.2 根因确认
1. **生产 Nginx 配置缺失代理规则**：实际在线配置 `/etc/nginx/sites-available/softtribe.top.conf`（与仓库内 [softtribe.top.prod.conf](file:///e:/Code/新建文件夹/softtribe.top.prod.conf) 一致）仅将 `/api/` 与 `/api/v1/downloads/` 代理至 Fastify (`127.0.0.1:3008`)，缺少 `sitemap*.xml`（及 `/robots.txt`）代理规则；同一服务器上的参考模板 [deploy/nginx/softbuluo.conf](file:///e:/Code/新建文件夹/deploy/nginx/softbuluo.conf#L62) 原先包含 `location ~* ^/(sitemap.*\.xml|robots\.txt)$`，但未写入 `softtribe.top` 生产配置。
2. **过期静态演示文件占位**：仓库存在遗留静态文件 [public/sitemap.xml](file:///e:/Code/新建文件夹/public/sitemap.xml)（指向 `soft.example.com`），构建后进入 `dist/sitemap.xml`，在 `try_files $uri` 中抢先响应并覆盖后端真实 `<sitemapindex>`。
3. **本地 Vite 开发代理未覆盖 Sitemap**：[vite.config.ts](file:///e:/Code/新建文件夹/vite.config.ts#L33-L43) 仅代理 `/api`，导致本地访问 `http://localhost:3000/sitemap-games.xml` 同样返回 `text/html`；而直连后端 `http://localhost:3001/sitemap-games.xml` 与生产后端 `http://127.0.0.1:3008/sitemap-games.xml` 均可正确输出 `application/xml; charset=utf-8` 完整 XML（包含 `/games`、`/game/supertuxkart`、`/game/mindustry`，不含草稿与测试数据）。

---

## 三、问题 2（P2）：游戏中心 (`/games`) CLS 布局偏移实测归因

通过 Playwright Headless Chromium 在本地 `http://localhost:3000/games` 注入 `PerformanceObserver({ type: 'layout-shift', buffered: true })` 逐帧抓拍各 DOM 偏移来源：

### 3.1 改版前多视口 CLS 基线实测数据
| 测试视口 | 模式/场景 | 总 CLS | 偏移事件 1（Header 品牌图加载微移） | 偏移事件 2（`FOOTER` 下移出视口） | FCP | 水平溢出 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `1440x900` | 冷启动亮色 | `0.1531` | `0.0006` (`t=422ms`) | **`0.1524` (`t=675ms`, `y: 601 -> 0`)** | `428ms` | `false` |
| `1440x900` | 冷启动深色 | `0.1531` | `0.0006` (`t=285ms`) | **`0.1524` (`t=534ms`, `y: 601 -> 0`)** | `280ms` | `false` |
| `1280x800` | 冷启动亮色 | `0.2230` | `0.0009` (`t=284ms`) | **`0.2221` (`t=543ms`, `y: 501 -> 0`)** | `264ms` | `false` |
| `1024x768` | 冷启动亮色 | `0.3017` | `<0.001` | **`~0.301`** | `~260ms` | `false` |
| `768x1024` | 冷启动亮色 | `0.1940` | `0.0003` (`t=259ms`) | **`0.1937` (`t=541ms`, `y: 677 -> 0`)** | `260ms` | `false` |
| `430x932` | 手机冷启动 | `0.3356` | `0.0006` (`t=268ms`) | **`0.3351` (`t=560ms`, `y: 530 -> 0`)** | `268ms` | `false` |
| `390x844` | 小屏冷启动 | `0.3885` | `0.0025` (`t=273ms`) | **`0.3860` (`t=558ms`, `y: 486 -> 0`)** | `272ms` | `false` |
| `1440x900` | 站内导航 `/` → `/games` | **`0.0000`** | 无 | 无 | — | `false` |

### 3.2 根因确认
- **`99.5%+` 布局偏移源于 `React.lazy` 全局 `PageLoadingFallback` 高度过矮**：[src/App.tsx](file:///e:/Code/新建文件夹/src/App.tsx#L161-L166) 中的 `PageLoadingFallback` 使用 `min-h-[50vh]`（仅约 422–450px）。在首屏冷加载 `/games` 异步下载 `GamesPage` JS Chunk 期间，`<SiteFooter>` 先被渲染到视口下半区（`y = 486..677px`）；模块挂载后页面主体撑开，整块 Footer 被瞬时推离视口，引发 `0.1524–0.3860` 的大额 `layout-shift`。
- **次要微移（`< 0.003`）**：Header 品牌图标加载完成后使品牌文字及导航条向右微移（`0.0003–0.0025`），远低于 0.05 阈值；而游戏焦点大图、游戏封面在站内切换加载时实际 `events = []`（`CLS = 0`）。
- 基线截图已归档：`p8741_before_games_1440.png`、`p8741_before_games_390.png`。

---

## 四、问题 3（P2）：P5 数据完整率不达标与历史测试数据累积污染

### 4.1 本地数据库只读实查统计（132 条 `Software` 记录）
| 维度 | 数量 / 比例 | 说明 |
| :--- | :--- | :--- |
| `Software` 总记录数 | `132` | 包含非测试与历史测试累积记录 |
| 非测试正式记录（`isTestData: false`） | `93` | 已发布 `30`（含游戏 `Mindustry`、`SuperTuxKart` 2 款）+ 草稿 `63`（含 8 款 `DRAFT` 游戏及 1 条历史遗留 `fastcopy-extreme`） |
| 标记测试记录（`isTestData: true`） | **`39`** | 全部为 `test-tool-*`（来自 `apiTest.ts` 累计 39 次运行未清理） |
| `VERIFIED_COMPLETE` 记录数 | `84` | 全部属于非测试记录（其中 8 款已发布资源及 `fastcopy-extreme` 为不完整状态） |
| P5 原公式完整率（含测试数据） | **`64%`** (`84 / 132`) | **低于 `65%` 阈值导致 P5 FAIL** |
| **剔除测试数据后的真实完整率** | **`90%`** (`84 / 93`) | 正式业务库内容完整度实际健康达标 |
| 其他无清理历史测试残留 | `topic-p3-*`: **`26` 条**；`tut-p3-*`: **`26` 条** | 来自 `p3OperationsTest.ts` 每次执行新增但未清理 |

### 4.2 根因确认
1. **治理指标未隔离测试样本**：[governanceService.ts](file:///e:/Code/新建文件夹/server/src/modules/governance/governanceService.ts#L181-L222) `getGovernanceMetrics()` 在计算 `totalResources` 与 `completenessRate = verifiedCompleteCount / totalResources` 时未过滤 `isTestData: false`，导致测例写入的测试样本不断拉低平台运营质量指标。
2. **历史测试套件缺失 `finally` 清理**：
   - [apiTest.ts](file:///e:/Code/新建文件夹/server/tests/apiTest.ts#L126-L238) 每次执行写入 `test-tool-${Date.now()}` 及关联记录（版本、下载源、打点、审计日志），运行结束后未删除；
   - [p3OperationsTest.ts](file:///e:/Code/新建文件夹/server/tests/p3OperationsTest.ts#L125-L435) 每次执行写入 `fastcopy-extreme`、`topic-p3-${Date.now()}`、`tut-p3-${Date.now()}` 与导入批次/候选/日志，运行结束后未清理。
3. **跨套件安全核对（确认零依赖误伤）**：本地仅留存极小规模 `isTestData: true` 或由 P5/测试在事务内自行保障时，需核实无其他套件硬编码依赖 `39` 条重复历史残余。
