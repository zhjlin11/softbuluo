# 软游部落 P9.0.1 —— 优质资源入库 SEO 结构化数据与 Sitemap 验收报告

**文档编号**：ST-P901-SEO-01  
**验收完成时间**：2026-11-14 00:15 (CST)  
**当前状态**：`P901_LOCAL_PASSED` / `P901_APPROVAL_REQUIRED`  
**核心准则**：真实描述、杜绝关键词堆砌、规范 Canonical、Schema.org 结构化、Sitemap 自动更新。

---

## 一、SEO 元数据规范与渲染策略

新发布的 10 款软件严格遵循软游部落统一的 SEO / SSR 生成规范，所有服务端静态渲染与客户端 Head 管理严格对齐：

### 1.1 核心 Meta 标签生成范式
- **Title 标题规范**：`{软件中文名} 官方最新版下载_{开发者}原厂直达_{一级分类名} - 软游部落`  
  *示例*：`CrystalDiskInfo 官方最新版下载_hiyohiyo原厂直达_系统工具 - 软游部落`
- **Meta Description 摘要规范**：`软游部落为您提供 {软件名} {最新版本} 官方正版下载。{软件简介}，支持 {操作系统}，提供原厂直链与镜像校验。`  
  *字数控制*：严格限制在 80 ~ 140 汉字，语义连贯，杜绝关键词无意义罗列。
- **H1 标题规范**：唯一且明确呈现软件中文名称与核心英文别名，页面其余层级采用 H2/H3 组织。
- **Canonical 规范链接**：严格指向前台规范路由 `https://softtribe.top/software/{slug}`，严禁携带参数查询尾巴（如 `?from=recommend`）。

---

## 二、Schema.org 结构化数据 (JSON-LD)

所有已发布软件详情页在 SSR 阶段自动注入 Google / 百度推荐的 `SoftwareApplication` 结构化微数据：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "CrystalDiskInfo",
  "operatingSystem": "Windows 10, Windows 11",
  "applicationCategory": "UtilitiesApplication",
  "softwareVersion": "9.4.4",
  "author": {
    "@type": "Organization",
    "name": "hiyohiyo / Crystal Dew World"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CNY"
  },
  "downloadUrl": "https://softtribe.top/software/crystaldiskinfo"
}
```

---

## 三、七大频道映射与内链互通

10 款首批候选资源依据业务属性精准挂载至相应一级频道，强化品类聚合权重：
- **系统工具频道 (`/system-tools`)**：
  - `crystaldiskinfo` (硬件检测)
  - `crystaldiskmark` (基准测试)
  - `gpuz` (显卡监控)
  - `ventoy` (系统维护)
- **电脑软件频道 (`/software`)**：
  - `putty` (网络工具)
  - `winscp` (文件传输)
  - `nodejs` (编程开发)
  - `python` (编程开发)
  - `potplayer` (影音播放)
- **游戏中心频道 (`/games`)**：
  - `openra` (开源经典重制)

---

## 四、动态 Sitemap 索引联动验证

系统在 [server/src/modules/seo/sitemapRoutes.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/sitemapRoutes.ts) 中具备动态 Sitemap 自动响应能力：
- `/sitemap-software.xml` 实时仅查询 `status = PUBLISHED AND isTestData = false` 的软件，一旦批次发布完成，10 款软件的 URL 将于下次爬虫请求时**毫秒级即时呈现**。
- `/sitemap.xml` 主索引文件自动聚合各子地图，无需手动执行静态生成脚本。
- `robots.txt` 规范放行爬虫抓取各软件页面及频道聚合页，严格封锁后台管理路由 `/admin/*` 与开发接口 `/api/v1/admin/*`。
