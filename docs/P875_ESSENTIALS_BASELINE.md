# 软游部落 P8.7.5 —— 装机必备频道（`/essentials`）改版前真实基线报告

> **基线审计时间**：2026-11-10 17:24 (UTC+8)
> **工程环境**：`E:\Code\新建文件夹`（`http://localhost:3000/essentials` + 本地 PostgreSQL）
> **基线审计原则**：全部数据均来自本次直接查询本地 PostgreSQL 与真实 Playwright + Chromium 检查结果，不凭历史报告推测。

---

## 一、Git 状态与保护边界确认

- 当前存在历史开发与 P8.7.4.1 遗留未提交工作区变更，本次严守修改边界：仅围绕 `/essentials`、装机频道聚合接口、后台 `ESSENTIALS` 展位管理、SEO/SSR/Sitemap 及本阶段测试/文档改动，绝不改变首页 `/`、`/software`、`/system-tools`、`/games`、全站 Header/Footer、详情页与商业支付业务。

---

## 二、改版前 `/essentials` 页面现状与截图实测

- **历史截图证据**：
  - 桌面端 `1440x900`：`C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p875_before_essentials_1440.png`
  - 手机端 `390x844`：`C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/p875_before_essentials_390.png`
- **Playwright 实测基线**：
  - HTTP 状态：`200`，页面 `h1`：`电脑装机必备软件方案`
  - Title：`装机必备软件方案 - 8大场景电脑装机推荐与一键清单 - 软游部落`
  - **Canonical 缺陷**：`<link rel="canonical">` 仍停留在静态 `index.html` 默认值 `https://softbuluo.com/`，未动态指向 `/essentials`
  - CLS：`0.0006` (`1440px`) / `0.0022` (`390px`)，无水平溢出（`overflowX: false`）
- **现有功能与严重缺失核查**：
  - 仅存在硬编码常量数组 `ESSENTIAL_SUITES`（8 组切换 Tab + 纯文本剪贴板复制按钮），**完全未接入后端 PostgreSQL API**；
  - **严重死链与未发布引用风险**：旧版 `ESSENTIAL_SUITES` 硬编码了大量库内实为 `DRAFT` 或根本不存在的软件/教程链接，包括 `potplayer`、`bandizip`、`quicklook`、`sharex`、`bleachbit`、`screentogif`、`gpuz`、`furmark`、`crystaldiskinfo`、`ventoy`、`memtest86`、`handbrake` 与 `tutorial-system-cleanup-guide`；
  - 缺少装机主题大图轮播、右侧装机工具快捷矩阵、装机流程 8 步时间线（系统下载合规说明、启动盘制作与官方驱动指引）、按分组选择与 TXT/JSON 安全清单导出、高风险工具预警箱、分类货架、真实专题/教程关联、真实榜单、版本更新区分与底部可筛选全量目录；
  - 后端 [seoRoutes.ts](file:///e:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts) 尚无 `GET /essentials` SSR 路由，`/robots.txt` 与动态 Sitemap 索引未纳入 `/essentials`；
  - 后台 [AdminChannelConfigPage.tsx](file:///e:/Code/新建文件夹/src/pages/admin/AdminChannelConfigPage.tsx) 与 [softwareChannelService.ts](file:///e:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts) 仅开放 `SOFTWARE`、`SYSTEM_TOOLS`、`GAMES`，无 `ESSENTIALS` 运营推荐配置入口。

---

## 三、本地 PostgreSQL 真实资源盘点

### 3.1 总体资产规模
- `Software` 表总记录：`92` 款（**`isTestData: true` 为 `0` 条**）
- 已公开发布（`PUBLISHED`）：**`30` 款**
  - 其中桌面应用 `SOFTWARE`：`13` 款
  - 系统与实用工具 `TOOL`：`15` 款
  - 独立游戏 `GAME`：`2` 款（`mindustry`、`supertuxkart`，装机必备非游戏软件池保持 `28` 款）
- 待审核草稿队列（`DRAFT`）：**`62` 款**（严格隔离，绝不在装机必备中暴露）
- 最新版本活跃下载源登记：`42` 条（其中 `APPROVED + HEALTHY` 为 `10` 条，带 `SHA-256` 实体文件哈希为 `0` 条），已核验 `SoftwareSource` 官方来源记录 `14` 条，非测试正式下载点击事件 `27` 次
- 已发布正式专题（`Topic`）：**`11` 个**（其中 `genuine-microsoft-installation-media` 当前 `coverUrl` 为 `null`，需使用本地原创安全图片兜底）
- 已发布实用教程（`Tutorial`，不含测试样本）：**`27` 篇**（含 4 篇平台规则/认领白皮书文档，面向普通用户的装机与工具实操教程 `23` 篇）
- 已发布横向对比评测：`2` 篇（`7zip-vs-peazip`、`vscode-vs-sublime`）
- `ChannelRecommendation` 现有配置：`0` 条（`ESSENTIALS` 尚未配置推荐位）

### 3.2 可见分类真实 `PUBLISHED` 数量分布
| 分类 Slug | 分类名称 | 已发布正式资源数 | 说明 |
| :--- | :--- | :--- | :--- |
| `sys-tools` | 系统工具 | `10` | `7zip`, `windows-11`, `everything`, `windows-ltsc`, `windows-10`, `windows-7`, `windows-server`, `diskgenius`, `geek-uninstaller`, `rufus` |
| `office` | 办公软件 | `7` | `office-2024`, `microsoft-365`, `office-2021`, `office-mac`, `sublime-text`, `libreoffice`, `peazip` |
| `network` | 网络工具 | `4` | `chrome`, `ab-download-manager`, `wireshark`, `filezilla` |
| `hardware` | 硬件检测 | `2` | `cpu-z`, `hwinfo` |
| `dev` | 编程开发 | `2` | `vscode`, `git` |
| `media` | 影音播放 | `2` | `obs-studio`, `vlc` |
| `graphic` | 图像设计 | `1` | `blender` |
| `games` | 单机游戏 | `2` | `mindustry`, `supertuxkart` |
| `drivers` | 驱动程序 | **`0`** | 当前无独立已发布条目，装机指南应真实引导 Windows Update / 电脑品牌及硬件厂商官网，不虚构空货架 |
| `security` | 安全工具 | **`0`** | 当前无独立已发布条目，安全配置流程指引 Windows Defender 与系统原生安全基线 |

---

## 四、可复用成熟组件与架构决策

1. **后端复用**：复用 [softwareChannelService.ts](file:///e:/Code/新建文件夹/server/src/modules/channels/softwareChannelService.ts) 的 `toCompactSoftware`、`pickChannelSoftwares`、`isWithinSchedule`、`validateChannelTarget` 与 `INTERNAL_POLICY_TUTORIAL_SLUGS` 过滤。
2. **前端复用**：复用 [SoftwareIcon](file:///e:/Code/新建文件夹/src/components/common/SoftwareIcon.tsx)（正版矢量图标+实体图标）、[SoftwareLeaderboards](file:///e:/Code/新建文件夹/src/components/software/SoftwareLeaderboards.tsx)（低样本自适应真实榜单）、[softwareHelpers.ts](file:///e:/Code/新建文件夹/src/components/software/softwareHelpers.ts) 与 `GET /api/v1/resources` 成熟筛选分页引擎。
3. **新增专项体系**：建立独立聚合服务 `essentialsChannelService.ts`、原创装机 Banner SVG 资源、6 大真实场景装机方案 + 按分组复选与安全 TXT/JSON 清单导出组件、8 步新机初始化时间线、风险警示维修工具箱、分类货架与完整装机目录，并补全 `/essentials` SSR、`CollectionPage` 结构化数据与 `/sitemap-essentials.xml`。
