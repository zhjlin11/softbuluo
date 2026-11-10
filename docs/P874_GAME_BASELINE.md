# 软游部落 P8.7.4 游戏中心 (`/games`) 基线盘点与升级方案

## 1. 现状盘点总结

### 1.1 本地数据库真实盘点（2026-11-10 实查）

- **GAME 类型全部记录共 10 条**（全部 `isTestData = false`），其中：
  - **已公开发布（`status = PUBLISHED`）：2 款**
    1. `Mindustry (像素工厂)`（`slug: mindustry`，`isFeatured: true`，`genre: 塔防与自动化工厂建造`，`licenseType: GPL-3.0`，`priceType: OPEN_SOURCE`，`distributionPlatform: Steam / Itch.io / GitHub Releases`，最新版本 `v146`，`fileSize: 85 MB`，`viewCount: 5`，`officialWebsite: https://mindustrygame.github.io`，`coverUrl: null`，但本地已存在 `public/images/games/mindustry-cover.jpg`、`mindustry-header.jpg` 及 `mindustry-screen-1..3.jpg`）。
    2. `SuperTuxKart`（`slug: supertuxkart`，`isFeatured: false`，`genre: 3D卡丁车竞速`，`licenseType: GPL-3.0`，`priceType: OPEN_SOURCE`，`distributionPlatform: Official Website / Steam / Itch.io`，最新版本 `1.4`，`fileSize: 约 100-800MB`，`viewCount: 0`，`officialWebsite: https://supertuxkart.net`，`officialDomainVerified: true`，`dataIntegrityStatus: VERIFIED_COMPLETE`，`coverUrl: null`，但本地已存在 `public/images/games/supertuxkart-cover.jpg` 及 `supertuxkart-screen-1..3.jpg`）。
  - **草稿状态（`status = DRAFT`，严禁前台展示或泄露）：8 款**
    - `openttd`（OpenTTD，v14.1）、`shattered-pixel-dungeon`（破碎的像素地牢，v2.5.4）、`0ad`（0 A.D.，Alpha 26）、`battle-for-wesnoth`（Battle for Wesnoth，v1.18.2）、`endless-sky`（Endless Sky，v0.10.12）、`warzone2100`（Warzone 2100，v4.5.5）、`luanti-minetest`（Luanti，v5.10.0，无下载源）、`openra`（OpenRA，release-20241215）。
- **下载源与安全核验现状（仅统计已发布 GAME）**：
  - 2 款已发布游戏各登记 1 条 `EXTERNAL_DOWNLOAD_PAGE` 来源，当前 `reviewStatus = PENDING`、`lastCheckStatus = UNKNOWN`、`verificationStatus = VERIFIED`、`sha256 = null`，**尚无实机 SHA-256 校验与健康直连标记**。
  - `DownloadEvent` 游戏下载事件当前为 `0` 条真实记录（历史浏览量：`mindustry` 为 5，`supertuxkart` 为 0）。
- **专题与教程关联盘点**：
  - 专题 `open-source-games-collection`（`精选开源跨平台经典游戏体验`，`status: PUBLISHED`）挂载 6 款游戏，但其中仅 `mindustry` 已发布，其余 5 款为 `DRAFT`，前台必须过滤草稿后按已发布数量真实展示。
  - 教程 `obs-studio-game-recording-settings`（`OBS Studio 高清 60FPS 游戏录屏与硬件编码参数最佳调优`，`status: PUBLISHED`）关联已发布工具 `obs-studio`；另有一篇 `openra-red-alert-multiplayer-setup`（`status: PUBLISHED`）关联的 `openra` 仍为 `DRAFT`，游戏中心前台不应将草稿游戏本体作为可下载游戏入口暴露。
  - 游戏辅助软件候选（`type != GAME`、`status = PUBLISHED`）：`OBS Studio`（录屏推流，已有本地截图）、`VLC Media Player`（本地录像回放，非游戏本体）。

### 1.2 改造前基线页面问题清单（来自 Playwright 真实渲染检查）

1. **视觉冲击力弱且未利用本地游戏大图资源**：仅显示 2 张通用紫色手柄图标卡片，未展示 `public/images/games/` 已有的游戏实机截图/封面大图，缺乏游戏频道应有的视觉横幅与画册质感。
2. **虚假/夸大安全声明风险**：卡片固定写死 `无捆绑 · 无内置充值 · 官方原厂哈希`，而数据库实际 `sha256 = null`、`reviewStatus = PENDING`，存在明显过度宣传与真实性不符。
3. **版本号拼接错误与过滤逻辑缺陷**：`Mindustry` 版本 `v146` 被硬编码拼接为 `vv146`；`模拟经营`、`休闲益智` 分类在无命中时错误 `return true` 返回全量游戏；平台筛选只是静态徽章不可交互。
4. **频道运营与门户模块缺失**：缺少 `/api/v1/channels/games` 接口、缺少游戏频道 Hero 轮播/主推推荐位、缺少游戏辅助工具隔离区、缺少排行榜与专题/攻略联动，且后台 `/admin/channels` 不支持 `GAMES` 频道配置。
5. **SEO 与 Canonical 缺陷**：旧版 `GamesPage` 完全未写入 `<link rel="canonical">`（继承首页 `https://softbuluo.com/`），后端缺少 `/games` SSR 路由与 `/sitemap-games.xml` 中的 `/games` 主频道入口，且 `robots.txt` 未收录 `Allow: /games`。

---

## 2. UI 3.0 升级设计原则

- **统一视觉与适度沉浸**：延续软游部落统一浅色工作区（`#F5F8FC` / 深色 `#0D1524`）及蓝系交互主色，但在游戏中心 Hero 横幅及专题卡片适度强化深靛蓝/电光青视觉氛围与 16:9 高清封面展示。
- **严谨克制、绝不注水**：遵循“按实际已发布内容诚实呈现”原则。在仅 2 款已发布游戏的前提下，合并同类展示位，隐藏无已发布游戏的空分类，排行榜动态显示“热推前 2 款（样本持续积累中）”并去除所有 0 计数占位与假评分/假在线人数。
- **游戏本体与配套工具严格隔离**：`OBS Studio`、`VLC` 等以独立模块标明“游戏辅助实用工具 · 不计入游戏数量”，不混入游戏总数与游戏榜单。
- **下载方式诚实区分**：依据 `sourceType / reviewStatus / lastCheckStatus / sha256` 如实区分“开源直链 / 官方下载页 / 商店发布页（Steam/Itch.io）”，绝不伪造原厂哈希校验结论。
- **本地隔离与零回归**：严禁批量上线 8 款 `DRAFT` 游戏，严禁修改首页 `/`、`/software`、`/system-tools` 及顶部/底部公共布局组件。
