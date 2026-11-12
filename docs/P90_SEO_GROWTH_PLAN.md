# 软游部落 P9.0 —— SEO 持续增长、元数据审计与收录监测规划

**文件标识**：ST-P90-SEO-01  
**编制时间**：2026-11-12  
**责任角色**：SEO 技术负责人 & 全栈架构师  
**实施状态**：`STAGE_A_COMPLETED (本地审计引擎就绪，待生产授权上线)`

---

## 一、SEO 运营定位与核心原则

软游部落致力于构建纯净、权威、长效的软件资源与技术教程门户。在进入 P9.0 正式运营阶段后，SEO 的核心目标是**建立有机搜索流量壁垒**，而非依靠短期黑帽或劣质内容堆砌。

### 1.1 核心原则
1. **数据诚实，杜绝虚构**：未接入官方 Webmaster API 的搜索引擎一律客观标明 `NOT_CONNECTED`（未授权接入），严禁伪造展示展示量、点击量或收录排名。
2. **结构规范，爬虫友好**：全站 7 大主栏目、所有详情页均部署标准 Canonical 标签、OpenGraph 社交卡片与 Schema.org JSON-LD 结构化数据。
3. **内容深耕，拒绝薄弱页 (Thin Content)**：教程文章严格实行字数与要件准入制；软件页面必须提供官方来源说明、安全校验哈希与真实版本说明。
4. **动态 Sitemap 实时同步**：以 1 个主索引地图驱动 9 个专项子地图，自动过滤测试数据 (`tut-p3-*`, `isTestData: true`) 与草稿资源。

---

## 二、全站 Sitemap 体系与索引结构

软游部落实现了基于后端 Fastify 实时流式生成的 XML Sitemap 索引矩阵，地址统一挂载于网站根目录：

| 地图地址 | 涵盖内容与收录口径 | 过滤与准入规则 |
| :--- | :--- | :--- |
| `https://softtribe.top/sitemap.xml` | **全局 Sitemap 索引 (SitemapIndex)** | 聚合以下 9 个子地图，引导搜索引擎爬虫并发抓取 |
| `https://softtribe.top/sitemap-channels.xml` | 7 大核心主导航频道 (`/`, `/software`, `/system-tools`, `/games`, `/essentials`, `/tutorials`, `/updates`) | 永久收录，`priority = 1.0`，`changefreq = daily` |
| `https://softtribe.top/sitemap-software.xml` | 电脑软件已发布正式详情页 (`/software/:slug`) | 仅限 `status = PUBLISHED` 且 `isTestData = false` |
| `https://softtribe.top/sitemap-tools.xml` | 系统工具已发布正式详情页 (`/software/:slug`) | 仅限 `type = TOOL` 且 `status = PUBLISHED` |
| `https://softtribe.top/sitemap-games.xml` | 游戏中心已发布正式详情页 (`/games/:slug`) | 仅限 `type = GAME` 且 `status = PUBLISHED` |
| `https://softtribe.top/sitemap-essentials.xml` | 装机必备专题与分类汇总页 (`/essentials`) | 包含各场景方案聚合与单品引流 |
| `https://softtribe.top/sitemap-tutorials.xml` | 软件教程已发布文章 (`/tutorials/:slug`) | 排除 `tut-p3-*` 测试数据，仅限 27 篇真实教程 |
| `https://softtribe.top/sitemap-updates.xml` | 最新更新聚合与时间线页 (`/updates`) | 每日动态更新最新发版资源索引 |
| `https://softtribe.top/sitemap-developers.xml` | 已认证开发者主页 (`/developers/:slug`) | 仅限通过认证的开发者公开展示页 |
| `https://softtribe.top/sitemap-legacy.xml` | 历史兼容路由 (`/compare`, `/community`) | 保持搜索引擎历史权重传递，避免产生 404 |

---

## 三、SEO 元数据自动化审计引擎 (`SeoAuditService`)

系统内置了页面 HTML 质量审计算法（已在 `server/tests/p90OperationsGrowthTest.ts` 维度 19 严格断言），可对任意页面实时评估 0-100 的 SEO 健康分：

### 3.1 核心评分维度与扣分规则
```typescript
// 伪代码摘要：SeoAuditService.evaluateHtmlSeo
if (!title) score -= 30; // 缺少 Title 属于致命缺陷
else if (title.length < 12) score -= 10; // 标题过短
else if (title.length > 75) score -= 10; // 标题过长可能被截断

if (!metaDescription) score -= 25; // 缺少 Description 扣 25 分
else if (metaDescription.length < 50) score -= 10; // 描述过短
else if (metaDescription.length > 200) score -= 10; // 描述过长

if (!hasH1) score -= 15; // 页面缺少顶级 H1 标签
if (!hasCanonical) score -= 10; // 缺少规范化链接易导致重复内容分散权重
if (!hasSchemaJsonLd) score -= 10; // 缺少结构化微数据
```

### 3.2 页面规范化标准模板
- **Title 格式**：`{资源名称} 官方正式版下载 - 软游部落高速直链`（控制在 20-50 字符）
- **Meta Description 格式**：`软游部落提供{资源名称}最新官方正式版下载，支持 Windows/macOS，附带完整安装配置教程与官方哈希校验，纯净高速无捆绑。`（控制在 80-150 字符）
- **Canonical 格式**：`<link rel="canonical" href="https://softtribe.top{path}" />`
- **Schema 结构化数据**：
  ```json
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "7-Zip",
    "operatingSystem": "Windows 10, Windows 11",
    "applicationCategory": "UtilitiesApplication",
    "downloadUrl": "https://softtribe.top/software/7zip"
  }
  ```

---

## 四、搜索引擎接入状态真实盘点

依据任务原则，本平台诚实披露各主流搜索引擎站长平台的当前接入状态，坚决不展示虚构的索引抓取数：

| 平台名称 | 平台标识 | 接入方式与现状 | 状态码 |
| :--- | :--- | :--- | :--- |
| **百度搜索资源平台** | `BAIDU_WEBMASTER` | 仅支持通过 DNS TXT 记录 / HTML 标签完成所有权验证；API 自动推送 Token 待站长申请 | `NOT_CONNECTED` |
| **微软 Bing Webmaster** | `BING_WEBMASTER` | 需通过 Bing API Key 接入 IndexNow 协议；待站长配置并保存至环境变量 | `NOT_CONNECTED` |
| **Google Search Console** | `GOOGLE_SEARCH_CONSOLE` | 支持 OAuth2 授权接入 Google Search API；待生成服务账号密钥 | `NOT_CONNECTED` |
| **360 站长平台** | `QIHOO_360` | 暂无开放自动化 API，仅支持手动提交 Sitemap 链接 | `NOT_CONNECTED` |
| **抖音/今日头条搜索平台** | `BYTEDANCE_SEARCH` | 暂未申请站长开发者凭据 | `NOT_CONNECTED` |

> [!NOTE]
> 运营后台 `/api/v1/admin/seo/search-consoles` 接口客观返回上述平台的 `NOT_CONNECTED` 真实状态，并在前端清晰引导管理员前往各官方站长平台进行 DNS/HTML 所有权认证。

---

## 五、内容质量准入与薄弱页监控机制

为防止搜索引擎判定平台为“采集站”或“死链垃圾站”，运营后台设立了以下内容准入与监控规则：

### 5.1 软件教程内容准入清单
- **正文字数**：正式发布的教程纯文本必须 $\ge 400$ 字符，禁止发布 1-2 句的空洞指引。
- **前置准备清单 (`preflightChecklist`)**：必须明确告知用户系统环境（如 Windows 11 64位）、运行库依赖或硬件要求。
- **高风险警示标记 (`riskLevel`)**：涉及磁盘分区 (DiskGenius)、格式化 (Rufus)、注册表修改等操作，必须强制声明风险提示语（`isHighRisk: true`）。
- **代码与操作块**：涉及命令行操作的教程，必须使用规范的多行代码块格式，并附带复制辅助功能。

### 5.2 软件资源页薄弱排查
- 软件无有效下载源时，页面自动展示“官方渠道维护中”的提示，不伪造第三方垃圾链接。
- 所有非测试资源详情页必须包含开发者信息、官网链接与许可证类型（开源/免费/商业试用）。

---

## 六、SEO 持续增长运营实施时间表

```mermaid
flowchart LR
    A["第一周: 基础夯实"] --> B["第二周: 站长平台认证"]
    B --> C["第三周: 外部权威外链建设"]
    C --> D["第四周: 关键词排名跟踪与内容迭代"]
```

1. **第一周（已完成）**：全站 7 大主栏目 Canonical、Title、Schema.org 结构化数据全量本地自动化测试覆盖。
2. **第二周**：完成域名 DNS TXT 记录解析，完成百度、Bing、Google 站长平台所有权认领，提交 `https://softtribe.top/sitemap.xml`。
3. **第三周**：向 GitHub 官方 Release 贡献软游部落直链，申请开源软件社区友好外链。
4. **第四周**：通过管理后台 `/admin/seo-audit` 定期跑批扫描，监控全站薄弱页与失效链接。
