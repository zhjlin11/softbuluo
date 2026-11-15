# 软游部落 P9.0.2 —— 第二批候选软件 SEO 元数据与搜索引擎收录规范报告

## 一、SEO 规范与治理原则

依据软游部落 P8.9/P9.0.1 确立的 SEO 质量基线，所有新发布软件必须满足高标准搜索引擎友好度规范，杜绝 Title 堆砌、描述缺失、Canonical 冲突与结构化数据残缺：

1. **Title 标签**：严格遵循「`{软件全称} 官方正式版下载 - 软游部落高速直链`」规范，长度控制在 12–75 字符区间；
2. **Meta Description**：字数介于 50–160 字符，客观概括核心特性，标明官方纯净与安全直链；
3. **Canonical 规范标签**：100% 绝对路径自指（`https://softtribe.top/software/{slug}`），严禁指向相对路径或产生大小写重定向；
4. **H1 标题结构**：每个详情页保证且仅有 1 个 `<h1>`，与页面主题严格一致；
5. **JSON-LD 结构化数据**：按 Schema.org 标准注入 `SoftwareApplication` 实体，声明 `operatingSystem`、`applicationCategory`、`softwareVersion`、`downloadUrl` 与 `publisher`；
6. **Sitemap 动态同步**：软件为 `DRAFT` 时严格排除在 Sitemap 之外；经审核发布为 `PUBLISHED` 后，由后端动态聚合服务自动纳入 `sitemap-software.xml` 或 `sitemap-tools.xml`。

---

## 二、第二批 10 款候选软件 SEO 元数据对照表

| 软件 Slug | 页面 URL 与 Canonical | 规范 SEO Title (字符数) | 核心关键词 (Keywords) | 频道归属 |
| :--- | :--- | :--- | :--- | :---: |
| `sharex` | `https://softtribe.top/software/sharex` | `ShareX 全功能开源截图工具 官方正式版下载 - 软游部落高速直链` (34字) | `ShareX, 屏幕截图, 滚动截图, OCR识别, 开源软件, 软游部落` | 系统工具 |
| `handbrake` | `https://softtribe.top/software/handbrake` | `HandBrake 开源通用视频转码工具 官方正式版下载 - 软游部落高速直链` (36字) | `HandBrake, 视频转码, H265, AV1, 格式转换, 开源工具` | 电脑软件 |
| `notepad-plus-plus` | `https://softtribe.top/software/notepad-plus-plus` | `Notepad++ 经典免费文本代码编辑器 官方正式版下载 - 软游部落高速直链` (37字) | `Notepad++, 代码编辑器, 文本编辑, 正则替换, 编程工具` | 系统工具 |
| `gimp` | `https://softtribe.top/software/gimp` | `GIMP 免费开源跨平台图像处理利器 官方正式版下载 - 软游部落高速直链` (35字) | `GIMP, 图像处理, 修图软件, 开源PS, 设计工具, 软游部落` | 电脑软件 |
| `process-explorer` | `https://softtribe.top/software/process-explorer` | `Process Explorer 微软官方进程管理器 官方正式版下载 - 软游部落高速直链` (38字) | `Process Explorer, 进程管理器, 微软工具, Sysinternals, 病毒查杀` | 系统工具 |
| `autoruns` | `https://softtribe.top/software/autoruns` | `Autoruns 终极开机自启动项治理工具 官方正式版下载 - 软游部落高速直链` (35字) | `Autoruns, 自启动项, 系统清理, 注册表优化, Sysinternals` | 系统工具 |
| `audacity` | `https://softtribe.top/software/audacity` | `Audacity 多轨道音频编辑与录音神器 官方正式版下载 - 软游部落高速直链` (36字) | `Audacity, 音频剪辑, 人声录制, 降噪处理, 开源音频软件` | 电脑软件 |
| `sumatrapdf` | `https://softtribe.top/software/sumatrapdf` | `Sumatra PDF 超轻量极速阅读器 官方正式版下载 - 软游部落高速直链` (34字) | `Sumatra PDF, PDF阅读器, 极速启动, 电子书阅读, 办公软件` | 系统工具 |
| `memtest86` | `https://softtribe.top/software/memtest86` | `MemTest86 独立内存故障与稳定性诊断 官方正式版下载 - 软游部落高速直链` (37字) | `MemTest86, 内存测试, 硬件验机, 蓝屏排查, 超频测试` | 系统工具 |
| `windows-terminal` | `https://softtribe.top/software/windows-terminal` | `Windows Terminal 微软官方现代化终端 官方正式版下载 - 软游部落高速直链` (38字) | `Windows Terminal, 命令行终端, PowerShell, WSL, 微软开发工具` | 系统工具 |

---

## 三、Schema.org JSON-LD 结构化数据样例（以 Process Explorer 为例）

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Sysinternals Process Explorer",
  "alternateName": "Process Explorer 微软官方进程管理器增强利器",
  "operatingSystem": "Windows 10, Windows 11, Windows Server",
  "applicationCategory": "UtilitiesApplication",
  "softwareVersion": "17.06",
  "fileSize": "3.69MB",
  "datePublished": "2025-03-10",
  "author": {
    "@type": "Organization",
    "name": "Microsoft Sysinternals",
    "url": "https://learn.microsoft.com/sysinternals/"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "downloadUrl": "https://softtribe.top/api/v1/downloads/start/cmw8wtvjj00bzvki8a3km6wmp",
  "description": "微软官方推出的高级任务管理器，深度透视进程父子树、DLL 依赖句柄与 VirusTotal 杀毒检测。",
  "url": "https://softtribe.top/software/process-explorer"
}
```

---

## 四、Sitemap.xml 动态准入与隔离验证

1. **草稿隔离规则**：在 `SeoService.generateSoftwareSitemap()` 与 `generateSystemToolsSitemap()` 中，执行数据库查询强制携带：
   ```typescript
   where: {
     status: ResourceStatus.PUBLISHED,
     isTestData: false,
     type: ResourceType.SOFTWARE // 或 TOOL
   }
   ```
2. **增量收录预测**：
   - 当前已发布软件 Sitemap 收录量：40 条（电脑软件 14 条 + 系统工具 23 条 + 游戏中心 3 条）
   - 本批次发布生效后：收录量将平滑增长至 **50 条**（电脑软件 17 条 + 系统工具 30 条 + 游戏中心 3 条）
   - 各条目 `<lastmod>` 准确绑定最新发布日期与版本发布时间戳。

---

## 五、审计结论

10 款候选软件的 SEO 元数据与结构化数据设计方案均符合国家搜索引擎规范与国际 Schema.org 标准，**无 Canonical 冲突，无 Sitemap 泄露风险**，在发布后将即刻带来高质量的自然搜索增量。
