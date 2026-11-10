# 软游部落 P8.7.6 —— 对比评测频道基线审计与改造前现状报告

> **目标频道**：`/compare`（对比评测）  
> **正式域名**：`https://softtribe.top/compare`  
> **本地端口**：前端 `http://localhost:3000/compare`，后端 `http://localhost:3001/`  
> **审计时间**：2026-11-10 19:20  
> **基线状态**：`AUDITED_READY_FOR_UPGRADE`

---

## 1. 改造前现有功能与架构现状

### 1.1 现有前端页面与路由
- **路由定义**（`src/App.tsx`）：
  - `/compare` -> `ComparisonListPage.tsx`（仅为一个简单的卡片流列表页，缺乏交互式对比工具）
  - `/compare/:slug` -> `ComparisonDetailPage.tsx`（文章详情页，展示固定两款软件的评测参数）
- **现有交互能力缺口**：
  - ❌ **无双软件选择器**：用户无法自主选择两款软件生成对比；
  - ❌ **无动态参数对比表**：页面仅展示预设文章，用户无法横向自选比较；
  - ❌ **无差异高亮/过滤**：无法在参数表中一键切换「仅显示差异项」；
  - ❌ **无对比分享与 URL 状态恢复**：不支持 `/compare?left=7zip&right=peazip` 等 URL 查询参数状态重现；
  - ❌ **无场景化选型建议组件**：未根据真实属性提供不同人群的选型指引；
  - ❌ **无分类发现与替代推荐**：分类浏览与替代软件未在频道主门户形成网格。

### 1.2 改造前截图留存
- 桌面端基线全屏（1440px）：`p876_before_compare_1440.png`
- 移动端基线全屏（390px）：`p876_before_compare_390.png`

---

## 2. 数据库实体与真实数据盘点

经直接连接 PostgreSQL 数据库实测盘点：

### 2.1 已发布对比文章（`SoftwareComparison`）
- **总收录对比文章**：2 篇（全部为 `status: PUBLISHED`）
  1. `7zip-vs-peazip`（7-Zip vs PeaZip：开源解压缩工具横向对比与选型指南）
     - 关联软件：`7zip` (PUBLISHED) 与 `peazip` (PUBLISHED)
     - 结构化属性：4 项（用户界面设计、格式兼容范围、安全加密特性、开源协议）
  2. `vscode-vs-sublime`（Visual Studio Code vs Sublime Text：深度横向对比与开发者选型指南）
     - 关联软件：`vscode` (PUBLISHED) 与 `sublime-text` (PUBLISHED)
     - 结构化属性：6 项（冷启动速度、空载基础内存、扩展与插件生态、超大文件打开能力、授权协议与费用、支持平台）
- **草稿中对比文章**：0 篇

### 2.2 可比较软件资源（`Software`）
- **已发布非测试桌面软件与系统工具**：**28 款**
  - **系统工具（TOOL）**：15 款（7zip, ab-download-manager, cpu-z, diskgenius, everything, geek-uninstaller, git, hwinfo, rufus, windows-10, windows-11, windows-7, windows-ltsc, windows-server, wireshark）
  - **桌面软件（SOFTWARE）**：13 款（blender, chrome, filezilla, libreoffice, microsoft-365, obs-studio, office-2021, office-2024, office-mac, peazip, sublime-text, vlc, vscode）
- **游戏（GAME）**：2 款（Mindustry, SuperTuxKart，按规范聚焦软件工具选型，不混入桌面软件对比）

### 2.3 替代软件关联（`SoftwareAlternative`）
- **已审核替代关系**：5 组
  1. `7zip` -> `peazip`（`SIMILAR_FUNCTION`，拥有更美观现代界面与双因素密钥保护）
  2. `vscode` -> `sublime-text` (`LIGHTWEIGHT_OPTION`，秒开超大文本日志与极限轻量内存占用)
  3. `office-2024` -> `libreoffice` (`FREE_ALTERNATIVE`，完全自由开源，无商业订阅负担)
  4. `hwinfo` -> `cpu-z` (`LIGHTWEIGHT_OPTION`，单文件 2MB 级快速验机)
  5. `diskgenius` -> `rufus` (`SIMILAR_FUNCTION`，专一轻巧的启动 U 盘镜像写入工具)

---

## 3. 字段完整度与真实对比参数映射

| 参数维度 | 对应数据库字段 / 关联 | 覆盖率 (28款) | 缺失时显示策略 |
| :--- | :--- | :--- | :--- |
| **基础信息** | `name`, `developer`, `latestVersion`, `category.name`, `catalogedAt`, `releaseDate` | 100% | 真实展示，版本发布日期无则标「以官网最新为准」 |
| **授权与费用** | `licenseType`, `priceType`, `price` | 100% | 格式化显示许可证名称，无价格标「免费/开源」或「商业授权」 |
| **系统兼容** | `platform` | 100% | 提取 Windows 10/11/7、64位/32位等系统支持信息 |
| **功能用途** | `summary`, `description` | 100% | 客观总结核心用途与解决场景，杜绝主观臆造跑分 |
| **包体与便携** | `fileSize` | 100% | 显示官方包体量级，未标便携版展示「以官方发布通道为准」 |
| **官方来源核验** | `officialSources` (来源数、SHA256核验数、健康状态) | 100% | 真实计算已登记与审核渠道数，标记是否具备原厂哈希比对 |
| **专属对比属性** | `ComparisonAttribute.valuesJson` (存在预设对比时加载) | 预设对比有效 | 若两款软件暂无编辑部实测属性，显示客观通用参数表并提示 |

---

## 4. 架构设计与升级任务拆解

### 4.1 新增/扩展后端能力
- 新增 `server/src/modules/channels/compareChannelService.ts`：
  - 聚合对比频道门户数据（焦点大图、热门对比、所有可比较软件检索列表、替代软件推荐、精选横向评测文章、分类统计）；
  - 提供动态双软件实时比对接口 `/api/v1/channels/compare/matrix?left=:slugA&right=:slugB`，自动组装基础信息、授权、平台、功能、来源以及已有的预设评测属性；
  - 校验 `PUBLISHED` 与非测试状态，拦截相同软件比较，拦截跨类别时的不匹配提醒。
- 新增后端路由：
  - `GET /api/v1/channels/compare`：频道主聚合数据；
  - `GET /api/v1/channels/compare/matrix`：实时 A/B 动态参数比对；
  - `GET /api/v1/channels/compare/search`：轻量软件选择器检索；
  - `GET /compare` SSR 支持：输出语义 H1、Canonical 与 ItemList 结构化数据。

### 4.2 前端组件规划（`src/components/compare/`）
1. `ComparePortalHero.tsx`：精选对比大图（左侧 65% VS 主题卡片，右侧 35% 热门对比入口）；
2. `CompareSoftwareSelectorAndMatrix.tsx`：核心 A/B 双软件选择器、搜索下拉、交换/清空、横向参数对比表、差异项过滤开关、URL 同步与复制分享；
3. `CompareDecisionGuide.tsx`：基于真实客观参数的场景化选型建议；
4. `CompareFeaturedArticles.tsx`：数据库真实已发布评测文章卡片流；
5. `CompareCategoryDiscovery.tsx`：按软件分类发现对比与可比资源计数；
6. `CompareAlternativeRecommendations.tsx`：已审核替代软件推荐卡片；
7. `CompareCatalogSection.tsx`：全部对比评测文章的关键词检索、分类筛选与分页列表。

---

## 5. 基线审计结论

系统具备完整的数据模型支持，且已有 2 篇高质量的对比文章和 28 款已发布非测试软件，数据真实可靠。当前准备就绪，可以安全、连续地开展本地开发与自动化验收。
