# 软件下载与电脑工具资源中心官网首页 (P0) 架构与实施方案

为电脑用户、IT运维工程师、维修技术人员及游戏玩家打造一个专业、可信、高效的现代化软件与工具资源发现平台官网首页。整体设计遵循中立严谨的软件评测与官方正版分发规范，杜绝虚假全网认证与诱导广告，提供毫秒级多维搜索、清晰版本来源溯源、系统维护专区与正版游戏导流。

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **核心决策确认与设计共识**
> 1. **品牌与站点配置**：全站名称与元数据统一由 `src/config/site.ts` 集中注入，默认品牌为「软件资源中心」，品牌文案、SEO、备案与联系信息均支持单点更改，全站零硬编码。
> 2. **数据策略与合规性**：建立标准化的 Repository 抽象服务层（`SoftwareService`），预置真实详尽的开源、免费及官方正版元数据（如 VS Code、7-Zip、VLC、CPU-Z、DiskGenius、Blender 等真实参数与官方哈希来源）；当数据为空时自动进入结构化 EmptyState 空状态，杜绝任何假造的“全网第一”伪数据。
> 3. **工程架构契合**：严格遵守工作原则第二条（“优先兼容现有结构，禁止不必要的重构”），在现有 Vite + React 19 + TypeScript + Tailwind CSS v4 现代化架构上，实现高内聚服务层、Zod 输入验证、类型守卫以及符合 Next.js / Server Components 迁移标准的前后端同构组件设计。
> 4. **视觉系统与反 AI Slop 规范**：严格执行 `frontend-design` 规范：Top Bar 遵循三区契约；元数据杜绝胶囊徽章堆叠（Zero-Pill），采用 `·` 微间距文本分隔；无虚假运行终端与脉冲假灯；默认采用高端明亮 SaaS 底色配合 Slate-900 沉浸式导航，并完整支持 `@custom-variant dark` 深浅主题切换。

---

## 1. Overview & Core Concept

- **产品定位**：可信赖、去广告化、版本透明的现代化软件与系统工具分发中枢。
- **目标用户**：日常办公人员、电脑维修技术员、网络运维工程师、游戏玩家与软件开发者。
- **首页核心价值**：**找软件更快，找来源更准，下载更放心**。用户在进入首页 3 秒内即可直达核心检索与系统分类。
- **业务服务模式 (方案 C)**：
  - **模式 A (官方直达)**：审核确认的官方下载直链与官网主页，免费开放。
  - **模式 B (授权托管)**：具备开源协议（GPL/MIT/Apache）或再分发许可的软件包，提供哈希校验与高速镜像预留接口。
  - **模式 C (增值服务预留)**：原创深度装机与维护教程、常用工具离线集合指南，预留合规接口，严禁放置虚假付费假按钮。

---

## 2. User Experience & Visual Design

### 2.1 页面区块序列 (Section Hierarchy)

```
┌────────────────────────────────────────────────────────┐
│ 1. 顶部导航 (SiteHeader: 品牌 | 核心频道 | 搜索/主题) │
├────────────────────────────────────────────────────────┤
│ 2. Hero 搜索区 (HeroSearch: 标语 + 56px 实时建议搜索框)│
├────────────────────────────────────────────────────────┤
│ 3. 快捷分类网格 (QuickCategories: 10 大核心场景入口)   │
├────────────────────────────────────────────────────────┤
│ 4. 编辑精选软件 (FeaturedSoftware: 8 款高频高信誉工具) │
├────────────────────────────────────────────────────────┤
│ 5. 热门下载排行榜 (PopularDownloads: 真实活跃排行)     │
├────────────────────────────────────────────────────────┤
│ 6. 最新版本更新 (LatestUpdates: 真实版本与 Changelog)  │
├────────────────────────────────────────────────────────┤
│ 7. 系统与维修工具专区 (ToolCategories: 运维差异化特色) │
├────────────────────────────────────────────────────────┤
│ 8. 游戏中心专区 (GameSection: 正版渠道/Steam/开源游戏) │
├────────────────────────────────────────────────────────┤
│ 9. 实用教程与故障排除 (TutorialSection: 真实干货指南)  │
├────────────────────────────────────────────────────────┤
│ 10. 平台核心保障 (PlatformBenefits: 可信/规范/持续更新)│
├────────────────────────────────────────────────────────┤
│ 11. 站点页脚 (SiteFooter: 4列合规导航 + 版权与备案)    │
└────────────────────────────────────────────────────────┘
```

### 2.2 视觉与设计规范
- **色彩预算 (60-30-10)**：
  - `60% Neutral Canvas`：亮色底 `#F6F8FC` / 暗色底 `#090D16`。
  - `30% Surface & Card`：纯白卡片 `#FFFFFF` / 暗色卡片 `#111827`，搭配 `1px border-slate-200 dark:border-slate-800`。
  - `10% Brand Accent`：科技深蓝 `#2563EB` 与 Hover `#1D4ED8`，状态色绿 `#16A34A`、橙 `#D97706`。
- **文字排版**：中英文字体栈采用 `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`；版本号、大小、发布日期统一采用 `tabular-nums` 等宽排版。
- **无胶囊元数据 (Zero-Pill Discipline)**：软件分类、版本号、平台系统（Windows 11/10 等）采用极简内联排版与 `·` 分隔，不堆砌花哨的彩底胶囊药丸，保持专业工具级的高级质感。
- **搜索交互体验**：
  - 56px 居中大搜索框，带清空、快捷键 `Ctrl+K` 提示与即时搜索按钮。
  - 250ms 防抖请求，支持上下方向键高亮、回车确认、ESC 退出。
  - 搜索结果卡片直接显示来源标识（官方来源 / 开源许可 / 镜像备用）及软件真实开发主体。
- **移动端自适应 (320px ~ 1440px)**：
  - 桌面端 1280px 居中版心与 12 列网格；
  - 手机端折叠抽屉菜单（Mobile Drawer），搜索框 100% 满宽触达，卡片从双列到单列无缝伸缩，触控热区全量 $\ge 44\text{px}$。

---

## 3. Technical Architecture & Data Strategy

### 3.1 架构层次模型

```
┌────────────────────────────────────────────────────────┐
│ UI Components Layer (Tailwind v4 + Lucide Icons)       │
│ [Header] [Hero] [SoftwareGrid] [ToolsTab] [GameSection]│
└───────────────────────────▲────────────────────────────┘
                            │ Typed Props & ViewModels
┌───────────────────────────┴────────────────────────────┐
│ Presentation & Hook Layer                              │
│ useSoftwareSearch | useCategories | useTheme           │
└───────────────────────────▲────────────────────────────┘
                            │ Async Service Calls
┌───────────────────────────┴────────────────────────────┐
│ Domain Service Layer (lib/services/softwareService.ts)  │
│ - searchResources(query, filters, pagination)          │
│ - getFeaturedSoftware() / getPopularSoftware()         │
│ - getLatestUpdates() / getToolsByCategory()            │
│ - getGames() / getTutorials()                          │
└───────────────────────────▲────────────────────────────┘
                            │ Validated Data Transfer (Zod)
┌───────────────────────────┴────────────────────────────┐
│ Data Access & Schema Layer (lib/db/ & lib/types/)      │
│ - Software, Version, DownloadSource, License, Event    │
│ - Indexed In-Memory Repository (PostgreSQL-Ready)      │
│ - Local Storage Theme & Search History Cache           │
└────────────────────────────────────────────────────────┘
```

### 3.2 数据实体模型 (Prisma / TypeScript Schema)

1. **Category (分类模型)**：
   - `id`: string, `name`: string, `slug`: string, `description`: string, `icon`: string, `sortOrder`: number, `count`: number
2. **Software (软件主体模型)**：
   - `id`, `name`, `slug`, `englishName`, `aliases`: string[], `developer`: string, `summary`: string, `description`: string, `iconUrl`: string, `type`: 'DESKTOP' | 'UTILITY' | 'DEV' | 'GAME', `categoryId`: string, `isFeatured`: boolean, `downloadCount`: number, `safetyScore`: number
3. **SoftwareVersion (版本模型)**：
   - `id`, `softwareId`, `version`: string, `platform`: string[], `architecture`: string[], `fileSize`: string, `releaseDate`: string, `changelog`: string, `isLatest`: boolean
4. **DownloadSource (下载渠道模型)**：
   - `id`, `versionId`, `sourceType`: 'OFFICIAL_EXTERNAL' | 'LICENSED_HOSTED' | 'COMMUNITY_MIRROR', `officialUrl`: string, `verificationStatus`: 'VERIFIED' | 'PENDING', `sha256`: string
5. **Tutorial (教程与排障模型)**：
   - `id`, `title`, `slug`, `summary`, `coverUrl`, `category`: string, `readTime`: string, `publishedAt`: string

### 3.3 搜索算法与中文分词处理
- 支持拼音、英文名、软件别名（如 `chrome -> 谷歌浏览器`, `7z -> 7-Zip`, `ps -> 图像处理`）多重加权模糊匹配；
- 关键词防注入与长度边界校验（限制 1~50 字符，清洗特殊控制字符）；
- 搜索防抖与竞争态控制（AbortController / requestId 校验）。

---

## 4. Implementation Steps & Verification Plan

### Phase 1: 基础设施与数据层构建
- 创建 `src/config/site.ts` 集中化站点配置（品牌名、导航、SEO、页脚合规信息）。
- 定义 `src/types/resource.ts` 强类型定义与 Zod 校验规则。
- 构建 `src/services/resourceService.ts` 标准化资源服务，内置真实高质量测试数据集与空状态兜底。

### Phase 2: 核心交互组件库研发
- 完善 `src/index.css`，配置 Tailwind v4 `@custom-variant dark` 确保深浅主题完美映射。
- 研发 `SiteHeader`（桌面 3 区契约 + 移动抽屉）与 `SiteFooter`（四列合规信息）。
- 研发 `HeroSearch`（大搜索框、防抖搜索建议弹层、键盘无障碍操作 `ArrowUp/Down/Enter/Escape`）。
- 研发通用 `SoftwareCard`、`SoftwareGrid`、`EmptyState`、`ErrorState` 骨架加载屏。

### Phase 3: 各核心业务专区装配
- `QuickCategories`：10 个高频分类卡片及计数统计。
- `FeaturedSoftware`：精选 8 款核心软件，标注官方来源与授权属性。
- `PopularDownloads`：真实下载频次榜单。
- `LatestUpdates`：更新日志与最新版本速览。
- `ToolCategories`：系统维护/硬件检测/网络诊断专项选项卡。
- `GameSection`：正版游戏与开源单机专区。
- `TutorialSection`：系统安装与故障解决教程卡片。
- `PlatformBenefits`：4 大真实可信保障。
- 软件简要详情模态框/抽屉，确保点击首页任意软件均能查看真实官方链接、哈希值与详细版本信息，无 404 挂死。

### Phase 4: SEO、无障碍与构建验证
- 更新 `index.html` 标题、元描述与 OpenGraph。
- 检查移动端宽度（320px、375px、430px、768px、1024px、1440px）无横向滚动条。
- 运行 `compile_applet` 和 `lint_applet` 确保 TypeScript 与 ESLint 0 警告 0 报错通过。
