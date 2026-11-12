# 软游部落 P8.9 全站缺陷与风险问题清单 (Issue Register)

## 一、问题分级判定标准

- **P0 紧急阻断**：系统崩溃、权限全面失控、数据库大规模损坏或资金数据丢失（当前：0 项）。
- **P1 必须优先修复**：数据严重虚标、核心下载链路阻断、重要安全/合规漏洞（当前：1 项，已本地修复）。
- **P2 重要改进**：SEO 规范缺陷、Sitemap 链接偏差、测试数据渗漏、未配置自动定时备份（当前：6 项，已修复或制定方案）。
- **P3 常规优化**：排版微调、非关键日志警告、磁盘空间长期预警（当前：1 项，已登记）。

---

## 二、全站问题台账与整改追踪

| 问题 ID | 严重级别 | 所属模块 | 问题描述 | 根因分析 | 处理状态 | 关联文件与验证方式 |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **ISS-01** | **P2** | 全站 SEO / Canonical | 客户端单页路由切换时，部分页面（更新、社区、对比、分类）的 `link[rel="canonical"]` 滞留在首页 `https://softtribe.top/` | `index.html` 默认静态写死首页 Canonical，各页面 `useEffect` 未动态更新该标签 | **已本地修复** | [src/utils/seo.ts](file:///E:/Code/新建文件夹/src/utils/seo.ts)<br>Playwright 54 视口断言 100% 正确匹配自身路由 |
| **ISS-02** | **P2** | SEO Sitemap XML | `sitemap-developers.xml` 与 `sitemap-community.xml` 根条目的 `<loc>` 误写为 `/tutorials` | 历史代码复制遗漏修改 | **已本地修复** | [server/src/modules/seo/seoRoutes.ts](file:///E:/Code/新建文件夹/server/src/modules/seo/seoRoutes.ts#L464)<br>单元测试已验证开发者与社区 Sitemap 入口正确 |
| **ISS-03** | **P1** | 宣传合规与内容可信度 | 首页装机必备与工具箱文案宣称“SHA-256 哈希校验防篡改”、“杜绝任何第三方商业篡改”，但实际来源表中尚未附带 SHA-256 哈希 | 早期模板静态文案夸大了目前的分级能力，违背客观审慎原则 | **已本地修复** | [EssentialSuites.tsx](file:///E:/Code/新建文件夹/src/components/home/EssentialSuites.tsx#L231)<br>[ToolCategories.tsx](file:///E:/Code/新建文件夹/src/components/home/ToolCategories.tsx#L50) |
| **ISS-04** | **P2** | 教程数据一致性 | 生产数据库中存在 17 篇历史自动化测试残留教程 (`tut-p3-*`)，导致 API 与 SSR 统计为 44 篇，与精选 Sitemap 27 篇不一致 | 聚合服务 `tutorialsChannelService.ts` 未加 `NOT: { slug: { startsWith: 'tut-p3-' } }` 过滤条件 | **已本地修复** | [tutorialsChannelService.ts](file:///E:/Code/新建文件夹/server/src/modules/channels/tutorialsChannelService.ts#L408)<br>前台教程总数与 Sitemap 完全统一为 27 篇 |
| **ISS-05** | **P2** | Nginx 反代与 SSR | 线上 Nginx 的爬虫 User-Agent 路由匹配仅包含 `(software\|system-tools\|games\|essentials)`，缺少 `/tutorials` 与 `/updates` | P8.7.8 与 P8.7.10 升级后线上 Nginx 规则未同步追加独立频道 | **待生产部署** | 方案详见 [P89_PRODUCTION_REMEDIATION_PLAN.md](file:///E:/Code/新建文件夹/docs/P89_PRODUCTION_REMEDIATION_PLAN.md) |
| **ISS-06** | **P2** | 网络安全与端口暴露 | 生产服务器对外暴露 8080 纯 HTTP 明文端口，可绕过 HTTPS 访问 API | 早期开发调试便利遗留端口 | **待生产加固** | 评估建议：限内部或反代前置，严禁明文外泄凭据 |
| **ISS-07** | **P2** | SRE / 灾难恢复 | 数据库仅在发布前手动备份，缺少系统级 Crontab 每日定时 Dump 与异地冷备份机制 | 运维自动化脚本未接入软游部落独立库 | **待运维实施** | 详见 [P90_OPERATION_READINESS.md](file:///E:/Code/新建文件夹/docs/P90_OPERATION_READINESS.md) |
| **ISS-08** | **P3** | 服务器资源管理 | 生产云盘 `/dev/vda2` 使用率达到 88%（剩余 8.0GB），存在长期累积风险 | 历史留存了多个 193MB 的全量 tar.gz 备份文件与临时缓存 | **已制定清理策略**| 方案详见 [P89_PRODUCTION_REMEDIATION_PLAN.md](file:///E:/Code/新建文件夹/docs/P89_PRODUCTION_REMEDIATION_PLAN.md) |

---

## 三、各缺陷整改前后对照证据

### 1. ISS-01：Canonical 规范化修复
- **整改前**：浏览器端访问 `https://softtribe.top/updates` 时，`document.querySelector('link[rel="canonical"]').href` 返回 `https://softtribe.top/`。
- **整改后**：访问 `/updates` 返回 `https://softtribe.top/updates`；访问 `/community` 返回 `https://softtribe.top/community`；访问 `/compare` 返回 `https://softtribe.top/compare`。

### 2. ISS-02：Sitemap XML 频道入口修正
- **整改前**：
  ```xml
  <!-- /sitemap-developers.xml -->
  <url><loc>https://softtribe.top/tutorials</loc></url>
  ```
- **整改后**：
  ```xml
  <!-- /sitemap-developers.xml -->
  <url><loc>https://softtribe.top/developers</loc></url>
  <!-- /sitemap-community.xml -->
  <url><loc>https://softtribe.top/community</loc></url>
  ```

### 3. ISS-03：文案真实度与防虚标合规
- **整改前**：“已核验 13 款场景软件 · 原厂数字签名 · SHA-256 哈希校验防篡改”
- **整改后**：“精选 13 款装机场景软件 · 官方来源人工审查 · 安全直连通道”

### 4. ISS-04：教程数据统计一致性
- **整改前**：生产 API 返回 44 篇（含 17 篇历史测试重名教程），Sitemap 返回 27 篇，数据口径脱节。
- **整改后**：API、SSR 与 Sitemap 三端统一口径，公开非测试实操教程精确为 27 篇。
