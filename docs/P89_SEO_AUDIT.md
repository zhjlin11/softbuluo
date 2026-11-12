# 软游部落 P8.9 全站 SEO、SSR 与搜索引擎友好度专项审计报告

## 一、SEO 审计总览与设计原则

软游部落（SoftTribe）采用 **SSR 服务端首屏 HTML 预渲染 + 客户端 SPA 动态水合** 的双模架构。本次专项审计重点排查了搜索引擎爬虫视角（Server-Side Rendered HTML）与真实用户浏览器视角（Client-Side Rendered DOM）之间的元数据一致性，彻底根除了历史上导致排名权重分散的“Canonical 首页回退”与“Sitemap 频道串标”问题。

---

## 二、七大主频道 SEO 元数据实测清单

| 频道 | 规范路由 | 页面 Title | H1 标签内容 | Canonical 规范链接 | 结构化数据 (JSON-LD) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **首页** | `/` | 软游部落 - 发现好软件，畅玩好游戏 \| 官方正版软件、系统维护工具与游戏资源平台 | 软游部落 | `https://softtribe.top/` | `WebSite`, `Organization` |
| **电脑软件** | `/software` | 电脑软件频道 - 开源与常用桌面软件发布渠道汇总 - 软游部落 | 电脑软件中心 | `https://softtribe.top/software` | `CollectionPage`, `ItemList` |
| **系统工具** | `/system-tools` | 系统维护与排障工具频道 - 装机检测、磁盘修复与极客诊断 - 软游部落 | 系统维护与排障工具中心 | `https://softtribe.top/system-tools` | `CollectionPage`, `ItemList` |
| **游戏中心** | `/games` | 正版与开源游戏资源频道 - 运行库环境、版本动态与官方获取渠道 - 软游部落 | 正版与开源游戏中心 | `https://softtribe.top/games` | `CollectionPage`, `ItemList` |
| **装机必备** | `/essentials` | 新电脑装机必备软件清单 - 6大场景方案与一键配置导出 - 软游部落 | 新电脑装机与必备软件中心 | `https://softtribe.top/essentials` | `CollectionPage`, `HowTo` |
| **软件教程** | `/tutorials` | 电脑软件教程与实用技术指南 - Windows系统安装、排障与办公实操 - 软游部落 | 软件教程与技术解决中心 | `https://softtribe.top/tutorials` | `CollectionPage`, `BreadcrumbList` |
| **最新更新** | `/updates` | 软件与游戏最新版本更新中心 - 官方更新日志与发布动态 - 软游部落 | 软件与游戏最新更新动态 | `https://softtribe.top/updates` | `CollectionPage`, `ItemList` |

---

## 三、抽样详情页 SEO 深度核查

### 1. 教程沉浸式详情页 (`/tutorials/rufus-win11-bypass-tpm-guide`)
- **SSR HTTP 状态**：`200 OK`
- **页面 Title**：使用 Rufus 制作绕过 TPM 2.0 与在线微软账户的 Windows 11 原版启动盘 - 软件教程 - 软游部落
- **页面 H1**：使用 Rufus 制作绕过 TPM 2.0 与在线微软账户的 Windows 11 原版启动盘
- **Canonical**：`https://softtribe.top/tutorials/rufus-win11-bypass-tpm-guide`
- **JSON-LD Schema**：`TechArticle` + `BreadcrumbList`
  - `@type`: `TechArticle`
  - `headline`: 使用 Rufus 制作绕过 TPM 2.0 与在线微软账户的 Windows 11 原版启动盘
  - `author`: 软游部落技术审核组
  - `datePublished`: 真实发版时间戳
  - `inLanguage`: `zh-CN`

### 2. 软件详情页 (`/software/visual-studio-code`)
- **SSR HTTP 状态**：`200 OK`
- **页面 Title**：Visual Studio Code 官方正版下载与版本详情 - 软游部落
- **Canonical**：`https://softtribe.top/software/visual-studio-code`
- **JSON-LD Schema**：`SoftwareApplication` (包含操作系统平台、应用分类与最新版本号)

### 3. 历史受保护页面 (`/compare` 与 `/community`)
- **可访问性**：HTTP 200，虽移出主导航，但未设为 404，完全保留历史外部反链与索引权重。
- **Canonical 正确性**：
  - `/compare` -> `https://softtribe.top/compare`（已脱离首页回退陷阱）
  - `/community` -> `https://softtribe.top/community`（已脱离首页回退陷阱）

---

## 四、Sitemap XML 完整性与覆盖率审计

软游部落部署了分级 Sitemap 体系，由 `/sitemap.xml` 索引主表调度 10 张专业分表：

| Sitemap 文件 | 覆盖范围 | 过滤条件 | 包含条目数 (实测) | 状态 |
| :--- | :--- | :--- | :---: | :---: |
| `/sitemap.xml` | 主 Sitemap 索引 | 聚合 10 个子 Sitemap | 10 | ✅ 正常 |
| `/sitemap-software.xml` | 电脑软件与系统工具 | `PUBLISHED`, `isTestData: false` | 28 | ✅ 正常 |
| `/sitemap-games.xml` | 游戏中心 | `type: GAME`, `PUBLISHED`, `isTestData: false` | 2 | ✅ 正常 |
| `/sitemap-essentials.xml` | 装机必备核心方案 | 6 大核心场景精选方案 | 6 | ✅ 正常 |
| `/sitemap-comparisons.xml` | 软件横向对比评测 | `status: PUBLISHED` | 2 | ✅ 正常 |
| `/sitemap-categories.xml` | 全站软件与工具分类 | `isVisible: true` | 14 | ✅ 正常 |
| `/sitemap-topics.xml` | 精选专题中心 | `PUBLISHED`, `NOT: topic-p3-*` | 11 | ✅ 正常 |
| `/sitemap-tutorials.xml` | 实用实操教程 | `PUBLISHED`, `NOT: tut-p3-*` | 27 | ✅ 正常 |
| `/sitemap-developers.xml` | 认证开发者门户 | `verificationStatus: VERIFIED` | 2 | ✅ 正常 |
| `/sitemap-community.xml` | 社区精选活跃讨论 | `status: ACTIVE`, `replyCount > 0` | 1 | ✅ 正常 |
| `/sitemap-updates.xml` | 最新更新频道入口 | 独立频道门户入口 | 1 | ✅ 正常 |

### Sitemap 规则明确核实（回应第二阶段问询）：
1. **关于社区讨论仅收录 1 条的原因**：
   - 源码逻辑：`where: { status: 'ACTIVE', replyCount: { gt: 0 } }`。
   - 数据库现状：生产库共有 4 篇帖子，但其中 3 篇为 0 回复的未解答初始帖，仅 1 篇拥有正式回复。因此过滤规则严格生效，旨在避免向搜索引擎提交“低质空内容页面”，符合高质量 SEO 策略。
2. **关于教程 Sitemap 仅收录 27 条的原因**：
   - 源码逻辑：`NOT: { slug: { startsWith: 'tut-p3-' } }`。
   - 过滤了 17 条历史 P3 阶段生成的自动化重复测试教程，精准收录 27 篇人工审查通过的技术指南。

---

## 五、Robots.txt 协议规范审计

访问 `https://softtribe.top/robots.txt`，实测输出如下：

```text
# 软游部落网络爬虫协议规范
User-agent: *
Allow: /
Allow: /software
Allow: /software/
Allow: /system-tools
Allow: /games
Allow: /game/
Allow: /essentials
Allow: /tutorials
Allow: /tutorials/
Allow: /updates
Allow: /compare
Allow: /compare/
Allow: /community
Allow: /community/thread/
Allow: /topics/
Allow: /category/
Allow: /developers/

# 严禁爬取后台管理系统、私有结算、会员中心与下载直链
Disallow: /admin
Disallow: /admin/
Disallow: /checkout
Disallow: /account
Disallow: /api/v1/downloads/
Disallow: /api/v1/admin/
Disallow: /api/v1/payments/

Sitemap: https://softtribe.top/sitemap.xml
```

- **合规性结论**：七大主频道与详情页均处于 `Allow` 允许状态；后台系统、用户结算与下载重定向流处于 `Disallow` 保护状态；Sitemap 声明标准完整。
