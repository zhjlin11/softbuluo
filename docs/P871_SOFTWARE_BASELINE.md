# 软游部落 P8.7.1 —— 电脑软件频道 (`/software`) 改版前基线审计报告

- **审计时间**：2026-11-10
- **审计目标路由**：`/software` (`http://localhost:3000/software` -> 正式规划 `https://softtribe.top/software`)
- **改版前截图**：`C:\Users\Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p871_before_software.png`
- **禁止修改范围**：首页 (`/` / `HomePage.tsx`)、全站 Header (`SiteHeader.tsx`)、Logo、游戏中心、系统工具、装机必备、对比评测、社区交流、软件教程、最新更新、软件详情页结构、会员与支付业务、生产服务器与线上数据库。

---

## 1. Git 工作区基线保护记录

执行 `git status -s` 确认当前本地仓库存在历史阶段（P1-P8.8）的大量已修改与未跟踪源码文件：
- 已修改关键文件：`index.html`、`package.json`、`src/App.tsx`、`src/services/resourceService.ts`、`src/types/resource.ts`、首页组件及 `SiteHeader.tsx` 等。
- 未跟踪目录与文件：`server/`、`src/pages/`、`src/components/`、`scripts/`、`docs/` 等。
- **保护原则**：严禁执行 `git checkout` / `git clean` / `git reset` 等清理命令，严格保留所有既有未提交修改；P8.7.1 仅在独立范畴内增量修改或新增模块。

---

## 2. 数据库真实资产盘点（非猜测，实测 PostgreSQL `softbuluo`）

### 2.1 软件资源分布 (`Software`)
| 类型 (`type`) | 状态 (`status`) | 测试标记 (`isTestData`) | 数量 | 说明 |
| :--- | :--- | :--- | ---: | :--- |
| `SOFTWARE` | `PUBLISHED` | `false` | **13** | 现 `/software` 仅拉取此 13 款，遗漏了全部 15 款常用桌面工具 (`TOOL`) |
| `TOOL` | `PUBLISHED` | `false` | **15** | 包含 Windows 11/10/LTSC/Server/7、7-Zip、Everything、DiskGenius、Git 等 |
| `GAME` | `PUBLISHED` | `false` | **2** | 游戏资源，应严格排除在 `/software` 外 |
| `TOOL` | `PUBLISHED` | `true` | **34** | 测试数据，不得出现在公开界面或统计总数中 |
| `SOFTWARE` / `TOOL` / `GAME` | `DRAFT` | `false` | **63** | 20 (`SOFTWARE`) + 35 (`TOOL`) + 8 (`GAME`) 待审草稿，禁止泄露至公开渠道 |

**桌面软件总有效已发布非测试资源**：`13 + 15 = 28` 款（所有非 `GAME` 桌面软件详情页均为 `/software/:slug`）。

### 2.2 可见分类与真实非游戏已发布计数 (`Category`)
| 分类名称 | `slug` | 非游戏已发布真实数 | 其中 `type=SOFTWARE` | 改版前页面展示异常 |
| :--- | :--- | ---: | ---: | :--- |
| 办公软件 | `office` | **7** | 7 | 曾显示 **41**（误计入 34 条 `isTestData: true` 测试数据） |
| 系统工具 | `sys-tools` | **10** | 0 | 曾显示 **10**，但点击后因页端传 `type=SOFTWARE` 返回 **0 条** |
| 网络工具 | `network` | **4** | 2 | 仅返回 2 条 |
| 硬件检测 | `hardware` | **2** | 0 | 点击返回 **0 条** |
| 影音播放 | `media` | **2** | 2 | 正常 |
| 编程开发 | `dev` | **2** | 1 | 遗漏 `Git for Windows` |
| 图像设计 | `graphic` | **1** | 1 | 正常 |
| 驱动程序 / 单机游戏 / 安全工具 | `drivers` / `games` / `security` | **0** | 0 | 0 条资源分类应过滤或降权，避免空分类误导 |

### 2.3 运营关联资产真实盘点
- **编辑精选推荐 (`isFeatured: true`, 非游戏已发布)**：**13** 款（如 `vscode`, `chrome`, `windows-11`, `windows-10`, `7zip`, `office-2024`, `microsoft-365`, `vlc`, `diskgenius`, `everything`, `wireshark`, `sublime-text`, `windows-ltsc`）。
- **浏览量 (`viewCount`) Top 样本**：VS Code (42)、Google Chrome (27)、Windows 11 (14)、Everything (8)、Office 2024 (8)、Windows LTSC (7)、Windows 10 (7)、Git (7)、Microsoft 365 (6)、Windows 7 (6)。
- **真实非测试下载事件 (`DownloadEvent`, `isTestEvent: false`)**：总计 **68** 次点击下载事件（Chrome 10 次、Git 3 次、Sublime Text 3 次、VS Code 2 次、Windows 10 2 次、LibreOffice 2 次、VLC 2 次等）。
  - *诚信规范*：绝对不允许伪造或放大成 `9999+` 假下载数，需清晰标明真实统计口径（如"近期下载点击"或"浏览热度"）。
- **已发布软件专题 (`Topic`, `status: PUBLISHED`)**：共 **32** 条记录，其中真实专题 **11** 条（如《Windows 11 新电脑装机必备工具指南》、《微软官方正版 Windows 与 Office 纯净安装镜像汇总》等），其余 **21** 条为 `topic-p3-*` 自动化测试生成记录，频道聚合接口必须过滤测试专题避免刷屏重复。
- **已发布软件教程 (`Tutorial`, `status: PUBLISHED`)**：共 **48** 条记录，其中真实教程 **27** 条，其余 **21** 条为 `tut-p3-*` 自动化测试生成记录，聚合接口应过滤测试 slug。
- **已发布横向对比 (`SoftwareComparison`, `status: PUBLISHED`)**：**2** 篇（`7zip-vs-peazip`、`vscode-vs-sublime`）。
- **版本更新与图标情况**：
  - `hasCoverCount = 0`：28 款软件当前均无 `coverUrl` 横幅图，需通过高质量原创主题渐变/矢量插画/规范图标卡优雅呈现大图推荐区，严禁盗用外链水印图片。
  - `missingIcons = 23`，`externalIcons = 5`（其中 4 个 Dicebear 占位 URL）：现有公共组件 `SoftwareIcon.tsx` 与 `officialLogos.tsx` 已可为全部已发布软件提供本地矢量 SVG / 官方图标兜底，需确保 100% 稳定加载。

---

## 3. 改版前页面 (`/software`) 核心问题诊断

1. **信息架构单薄，门户感不足**：当前仅为"大图标题+重复页内搜索框+筛选条+4列网格"，缺少软件发现门户核心的焦点图与本周热推、热门分类快捷卡片、编辑精选、双口径排行榜、专题与教程/评测联动、以及最近收录与版本更新分区。
2. **Header 与 Hero 搜索重复**：`SiteHeader` 已提供全局 `Ctrl + K` 搜索入口，改版前 `/software` 顶部 Banner 高度偏大且重复放置了大号搜索栏；新版应改为 `75–110px` 紧凑频道头与面包屑。
3. **跨组件数据口径错配**：
   - `/api/v1/categories` 未过滤 `isTestData: false`，导致"办公软件 41"假高数量。
   - `/software` 默认筛选 `type=SOFTWARE` 丢弃了 15 款 `TOOL` 桌面常用软件，点击"系统工具"等分类竟显示空列表。
4. **卡片长版本/长名称未做精简展示**：未复用 `src/utils/softwareName.ts` 中的 `getSimpleSoftwareName` 和 `getSimpleVersion`，导致卡片上出现 `vProPlus 2024 完整离线镜像 (x32/x64 简体中文)` 等多行溢出的超长胶囊标签。
5. **SEO Canonical 缺陷与缺失独立 SSR 入口**：
   - 浏览器实测 `/software` 时 `<link rel="canonical">` 仍停留在 `https://softbuluo.com/` 首页地址；
   - `server/src/modules/seo/seoRoutes.ts` 尚未提供独立的 `GET /software` 服务端语义 HTML 页面，需补充并支持 `canonical`、OpenGraph、Meta Description 与动态站点域名配置。
6. **缺少分栏频道运营推荐配置闭环**：尚无独立的 `ChannelRecommendation`（支持 `HERO`、`WEEKLY_PICK`、`EDITOR_PICK`、`TOPIC_PICK`、`CATEGORY_PICK` 槽位与排序/生效时间）数据库模型与后台安全管理界面（需强制校验仅关联 `PUBLISHED` 且非 `isTestData` 资源及安全站内/白名单图片链接）。

---

## 4. 可复用现有模块与基础设施

- **前端图标与名称工具**：`src/components/common/SoftwareIcon.tsx`、`src/components/common/officialLogos.tsx`、`src/utils/softwareName.ts`（`getSimpleSoftwareName`、`getSimpleVersion`）。
- **后端核心数据与 SEO 引擎**：`server/src/modules/resources/resourceRoutes.ts`、`server/src/modules/topics/topicRoutes.ts`、`server/src/modules/comparisons/comparisonRoutes.ts`、`server/src/modules/tutorials/tutorialAdminRoutes.ts`、`server/src/modules/seo/seoService.ts`、`server/src/config/index.ts`。
- **后台布局与权限鉴权**：`src/components/admin/AdminLayout.tsx`、`server/src/middleware/auth.ts` (`requireAuth`, `requireRole`)。
