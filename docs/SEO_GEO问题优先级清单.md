# 软游部落（SoftTribe）P9.1.1 —— SEO + GEO 问题优先级清单（Issue Ledger）

> **编制日期**：2026年11月17日  
> **状态**：待评审与确认（Ready for Review）  
> **说明**：本清单系统性整理了软游部落在全站 SEO、GEO、AEO、服务器网关、Sitemap 及内容资产全量审计中发现的 15 项关键问题，按严重度（P0/P1/P2/P3）严密分级，并附带可直接执行的代码/配置修复方案与验收标准。

---

## 优先级等级定义

- **P0（阻断级）**：直接导致搜索引擎爬虫无法抓取正文、全站无法建立索引、或者存在用户侧严重 404 故障的致命问题。必须作为首要任务立即解决。
- **P1（严重影响）**：导致爬虫信任度扣分、权重大幅稀释、重复收录惩罚、或阻断主流 AI 引擎引用的高危问题。
- **P2（中度体验与丰富度）**：影响搜索点击率（CTR）、富媒体摘要（Rich Snippets）展示、或正文深度不够中度扣分的问题。
- **P3（细节与长效优化）**：规范性文件完善、微小格式微调、以及长效运营治理项。

---

## 一、P0 阻断级问题清单（4 项）

### ISSUE-P0-01：Nginx 爬虫代理规则缺失详情页，导致全站详情页抓取返回 SPA 空白壳

- **问题级别**：P0（阻断级）
- **影响范围**：全站所有软件详情页（`/software/*`、`/tool/*`、`/game/*`）、教程详情页（`/tutorials/*`）、分类页（`/category/*`）与专题页（`/topics/*`）
- **涉及 URL**：`https://softtribe.top/software/*`、`https://softtribe.top/tutorials/*`（共计 77+ 个核心收录目标）
- **根本原因**：
  在生产服务器 `/etc/nginx/sites-available/softtribe.top.conf` 中，爬虫代理 location 规则写成了：
  ```nginx
  location ~* ^/(software|system-tools|games|essentials|tutorials|updates|compare|community)$
  ```
  末尾带了 `$`，**仅匹配频道根目录，完全排除了所有二级子页面**！所有二级详情页全部回退到 `location /`，向 Googlebot、Baiduspider 返回 SPA `index.html` 静态壳。
- **负面影响**：
  搜索引擎爬虫访问全站 77 个正式详情页时，看到的都是相同的首页标题、首页 Canonical（`href="https://softtribe.top/"`）以及空白的 `<div id="root"></div>`。搜索引擎判定为大量重复薄页面，**导致全站详情页完全不被收录（Google 真实收录量为 0）**！
- **修复方案**：
  修改 Nginx 配置，移除末尾 `$` 限制，放行所有子路径到 Fastify 后端，并包含所有的路由前缀：
  ```nginx
  # 修改前：
  location ~* ^/(software|system-tools|games|essentials|tutorials|updates|compare|community)$ {
      if ($http_user_agent ~* (Baiduspider|Googlebot|bingbot|Bytespider|360Spider|Sogou|YisouSpider)) {
          proxy_pass http://127.0.0.1:3008;
          break;
      }
      try_files $uri $uri/ /index.html;
  }

  # 修改后（推荐方案）：
  location ~* ^/(software|tool|game|system-tools|games|essentials|tutorials|tutorial|updates|category|topics|compare|community) {
      if ($http_user_agent ~* (Baiduspider|Googlebot|bingbot|Bytespider|360Spider|Sogou|YisouSpider|GPTBot|ClaudeBot|PerplexityBot|DeepSeekBot|Applebot)) {
          proxy_pass http://127.0.0.1:3008;
          break;
      }
      try_files $uri $uri/ /index.html;
  }
  ```
- **验收方法**：
  使用命令行模拟搜索引擎访问：
  ```bash
  curl -s -A "Googlebot" https://softtribe.top/software/7zip | grep -i "<title>"
  ```
  验证输出为 `7-Zip 24.09 官方下载渠道与版本信息 - 压缩备份 - 软游部落`，且包含正文与正确 Canonical 标签，而非首页 SPA 壳。

---

### ISSUE-P0-02：2 篇正式教程内容为存根占位符（字数 < 20），严重违反质量标准

- **问题级别**：P0（阻断级）
- **影响范围**：装机必备核心教程、加密工具核心教程
- **涉及 URL**：
  1. `https://softtribe.top/tutorials/clean-install-win11-guide`（Windows 11 纯净安装全流程与防踩坑指南）
  2. `https://softtribe.top/tutorials/7zip-aes256-encryption-tutorial`（7-Zip 高强度 AES-256 加密与防暴力破解实战）
- **根本原因**：
  历史版本快速初始化时，正文内容仅填充了占位符字符串（如 `"详细实操步骤与安全核验技巧..."`），随后未经严格字数校验便被批准发布。
- **负面影响**：
  这两篇教程是用户搜索频次极高的黄金词汇（Win11安装、7-Zip加密）。用户和爬虫访问后看到仅有一句话，会触发极高的即时跳出率；极易触发 Google Panda / Helpful Content 或百度「极光算法」对站内低质垃圾内容的整体降权。
- **修复方案**：
  1. 为 `clean-install-win11-guide` 补充系统级实操教程（包含硬件要求绕过、Rufus 制作 UEFI 启动盘、磁盘分区选择、OOBE 阶段跳过微软强制联网登录账户技巧、系统首次开机驱动排查），正文字数提升至 1200+ 字；
  2. 为 `7zip-aes256-encryption-tutorial` 补充完整教程（包含 7z 格式特性、AES-256 算法配置、加密文件名参数勾选、密码字典防御建议、跨平台解密注意事项），正文字数提升至 900+ 字。
- **验收方法**：
  后台重新核验字数，前台检查富文本排版，确保包含完整小标题、代码/参数块与操作警示框。

---

### ISSUE-P0-03：8 篇正式教程包含指向未发布草稿软件的断链（404）

- **问题级别**：P0（阻断级）
- **影响范围**：教程内链网络、用户体验
- **涉及 URL**：
  1. `/tutorials/wireshark-packet-capture-analysis-tutorial` -> 链接至 `/software/wireshark`
  2. `/tutorials/obs-studio-live-recording-settings-guide` -> 链接至 `/software/obs-studio`
  3. `/tutorials/git-tortoisegit-team-collaboration-tutorial` -> 链接至 `/software/git`
  4. `/tutorials/putty-ssh-server-connection-tutorial` -> 链接至 `/software/putty`
  5. `/tutorials/libreoffice-replace-ms-office-guide` -> 链接至 `/software/libreoffice`
  6. `/tutorials/obsidian-markdown-knowledge-base-guide` -> 链接至 `/software/obsidian`
  7. `/tutorials/dbeaver-database-management-tutorial` -> 链接至 `/software/dbeaver`
  8. `/tutorials/openra-red-alert-multiplayer-guide` -> 链接至 `/software/openra`
- **根本原因**：
  这 8 款软件在数据库中状态仍为 `DRAFT`（非测试草稿），未正式发布；但前期上线的教程正文中已静态硬编码了配套软件的内链。
- **负面影响**：
  用户在阅读教程后点击软件下载，直接返回 404 页面或空白错误页，造成极差的用户转化；搜索引擎爬虫追踪内链遭遇 404，导致内链健康度扣分。
- **修复方案（双轨制）**：
  - *方案 A（推荐增量发布）*：按 P9.0.2 的严格标准，优先核验这 8 款知名高价值软件（Wireshark、OBS、Git 等均为极其正规的开源神器），完善官方证据链后审核发布，变断链为优质流量闭环；
  - *方案 B（临时过渡）*：在软件未发布前，调整教程前端模板：若关联软件处于 `DRAFT`，仅展示软件名称纯文本及官方官网直链，不生成站内 `/software/:slug` 内部超链接。
- **验收方法**：
  使用自动化脚本或 Playwright 遍历 27 篇教程的所有内链，确保 0 个 404/500。

---

### ISSUE-P0-04：3 款系统工具类资源处于零活跃下载来源状态

- **问题级别**：P0（阻断级）
- **影响范围**：Windows 操作系统核心资源
- **涉及 URL**：
  1. `https://softtribe.top/software/windows-7`
  2. `https://softtribe.top/software/windows-ltsc`
  3. `https://softtribe.top/software/windows-server`
- **根本原因**：
  P9.0 治理中核查到原先收录的第三方网盘或非官方第三方下载源存在合规与失效风险，进行了批量安全下线停用；导致当前关联的有效 `downloadSources` 为 0。
- **负面影响**：
  用户搜索「Windows 7 官方下载」进入后发现无下载链接，极易迅速关掉网页；下载转化率为 0。
- **修复方案**：
  在版本下载源中，合规补齐微软官方渠道或正规引导：
  - Windows 7：明确标示微软官方已于 2020 年停止支持（EOL），提供微软官方归档说明页及合规升级至 Win10/11 的指引链接；
  - Windows LTSC / Server：接入微软评估中心（Microsoft Evaluation Center）官方合法试用版/评估镜像通道，附带官方 SHA256 校验和。
- **验收方法**：
  页面展示明确的官方评估中心下载按钮及官方 SHA256 验证，不再显示「暂无可用下载源」。

---

## 二、P1 严重影响问题清单（4 项）

### ISSUE-P1-01：`sitemap-software.xml` 存在全量别名重复条目，稀释抓取预算

- **问题级别**：P1（严重影响）
- **影响范围**：软件 Sitemap
- **涉及模块**：`server/src/modules/seo/seoRoutes.ts`
- **根本原因**：
  Sitemap 生成逻辑中，对 47 款非游戏软件同时循环输出了 `/software/:slug` 和 `/tool/:slug`，导致输出 96 条记录（包含 47 条重复别名）。而 `/tool/:slug` 渲染时输出的 Canonical 标签均指向 `/software/:slug`。
- **负面影响**：
  搜索引擎爬虫会按 Sitemap 抓取 `/tool/` 网址，抓取后发现 Canonical 全部指向 `/software/`，导致浪费一半的抓取预算，并触发 Google Search Console 报出大量「已编入索引，但属于重复网页（非用户所选规范网页）」警告。
- **修复方案**：
  修改 `server/src/modules/seo/seoRoutes.ts`，在 `sitemap-software.xml` 中移除 `/tool/:slug` 的冗余输出，仅保留主规范路径 `/software/:slug`。
- **验收方法**：
  重新请求 `https://softtribe.top/sitemap-software.xml`，校验总 URL 数为 49 条（2 个频道入口 + 47 款软件），无任何 `/tool/` 别名。

---

### ISSUE-P1-02：10 篇正式教程内容偏短（140-250 字），存在薄内容降权风险

- **问题级别**：P1（严重影响）
- **影响范围**：软件实操教程栏目
- **涉及教程**：
  `geek-uninstaller-clean-registry-tutorial`, `everything-http-server-lan-share-guide`, `bandizip-smart-unpack-tutorial`, `potplayer-madvr-hdr-setup-guide`, `rufus-bypass-tpm-win11-usb-tutorial`, `crystaldiskinfo-health-status-check`, `trafficmonitor-taskbar-skin-guide`, `snipaste-pin-to-screen-guide`, `ditto-clipboard-history-sync-guide`, `honeyview-fast-image-viewer-guide`。
- **根本原因**：
  前期编写时以功能特性总结为主，缺乏分步图文操作指引与常见报错排查。
- **负面影响**：
  在百度和 Google 的内容质量模型（Helpful Content Update）中，200 字左右的文章极易被归类为「Thin Content」（薄弱内容），难以在竞争激烈的教程长尾词中获得首页排名。
- **修复方案**：
  依据真实操作步骤逐篇扩充：
  - 增加「前置准备与版本环境」；
  - 增加「分步详细图文操作步骤（Step 1/2/3）」；
  - 增加「常见排障与快捷键小技巧」；
  - 扩充后平均字数达到 600-900 字。
- **验收方法**：
  后台文本统计验证字数均超过 600 字，包含语义化清晰的 `H2/H3` 结构。

---

### ISSUE-P1-03：Nginx 爬虫白名单排除主流 AI 抓取爬虫，阻断 GEO 引用

- **问题级别**：P1（严重影响）
- **影响范围**：GEO、AEO 与 AI 搜索引用
- **涉及模块**：`/etc/nginx/sites-available/softtribe.top.conf`
- **根本原因**：
  当前 User-Agent 白名单仅包含 `(Baiduspider|Googlebot|bingbot|Bytespider|360Spider|Sogou|YisouSpider)`，排除了 `GPTBot`、`ClaudeBot`、`PerplexityBot`、`DeepSeekBot`、`Applebot` 等。
- **负面影响**：
  当用户在 Perplexity、Kimi、ChatGPT、DeepSeek 中询问「推荐 Windows 干净无捆绑的下载站」或「7-Zip 官网下载地址」时，AI 爬虫实时访问本站页面只能抓取到 SPA 空白壳，无法读取到最新版本、真实哈希与核验记录，导致 AI 放弃引用软游部落作为信源。
- **修复方案**：
  在 User-Agent 正则中补充加入主流 AI 爬虫 User-Agent 标识。
- **验收方法**：
  ```bash
  curl -s -A "PerplexityBot" https://softtribe.top/software/7zip | grep -i "<title>"
  curl -s -A "GPTBot" https://softtribe.top/software/7zip | grep -i "<title>"
  ```
  均能正确返回 Fastify SSR 渲染的完整 HTML。

---

### ISSUE-P1-04：`sitemap-essentials.xml` 与 `sitemap-topics.xml` 重复收录

- **问题级别**：P1（严重影响）
- **影响范围**：Sitemap 架构
- **涉及模块**：`server/src/modules/seo/seoRoutes.ts`
- **根本原因**：
  装机必备专题（如 `win11-essential-tools` 等 6 个专题）在 `sitemap-essentials.xml` 中输出了一遍，同时又在 `sitemap-topics.xml` 中以相同 URL 全量输出了一遍。
- **负面影响**：
  同一批 URL 在主 Sitemap 索引下的不同子文件中重复声明，造成 Sitemap 冗余。
- **修复方案**：
  明确边界：`sitemap-essentials.xml` 仅收录装机必备核心频道入口 `/essentials` 以及专属核心专题；`sitemap-topics.xml` 过滤掉已在装机必备中声明的 slug。
- **验收方法**：
  对比两份 Sitemap 的 URL 列表，两者的 URL 交集为空。

---

## 三、P2 中度体验与丰富度问题清单（4 项）

### ISSUE-P2-01：软件与教程详情页缺少 `FAQPage` 与 `HowTo` 结构化数据

- **问题级别**：P2（中度体验与丰富度）
- **影响范围**：全站 77 个正式详情页
- **根本原因**：
  当前 SSR 仅输出了 `SoftwareApplication`（软件页）和 `TechArticle`（教程页），未利用 Schema.org 的 `FAQPage` 和 `HowTo` 规范。
- **负面影响**：
  搜索引擎搜索结果无法呈现下拉式问答手风琴（FAQ Rich Snippet）和分步步骤（Step Carousel），点击率（CTR）比拥有富媒体摘要的竞品低 25-40%。
- **修复方案**：
  在 `server/src/modules/seo/seoService.ts` 中：
  - 软件详情页注入包含 3-4 个高频提问的 `FAQPage`（如：支持 Win11 吗？有捆绑软件吗？如何验证安装包完整性？）；
  - 教程详情页注入 `HowTo` 结构化数据，提取各小节作为 `HowToStep`。
- **验收方法**：
  通过 Google 富媒体搜索结果测试工具（Rich Results Test）在线验证，通过 0 错误检测。

---

### ISSUE-P2-02：E-E-A-T 可信度背书欠缺作者个人资质与测试机环境

- **问题级别**：P2（中度体验与丰富度）
- **影响范围**：全站教程与软件评测
- **根本原因**：
  作者署名统一为泛化的「软游部落技术团队」，缺少具体工程师 Profile、测试硬件环境（如：实测平台 Windows 11 23H2 / i7-13700H）及核验责任人。
- **负面影响**：
  在 Google E-E-A-T 质量评估模型中，缺少明确的真实作者资历（Author Expertise）和第一手实操测试证据，影响权威度（Authority）评分。
- **修复方案**：
  在教程与软件详情页底栏增加「安全核验与测试环境档案」小卡片，列明：
  - 测试设备（如：VMware Workstation 纯净 Win11 虚拟机）；
  - 杀毒扫描引擎（如：Windows Defender + VirusTotal 0 报毒）；
  - 审核工程师代号与最后上机复测时间戳。
- **验收方法**：
  前台页面及 SSR HTML 中均呈现清晰的测试证据链卡片。

---

### ISSUE-P2-03：8 款软件官方描述过于单薄（少于 100 字符）

- **问题级别**：P2（中度体验与丰富度）
- **影响范围**：50 款软件中的 8 款
- **涉及软件**：`ditto`, `snipaste`, `honeyview`, `crystaldiskmark`, `eMule`, `winfile`, `space-cadet-pinball`, `minesweeper`
- **根本原因**：
  仅录入了 1-2 句官方基础介绍，未补充软件的标志性特性与适用场景。
- **负面影响**：
  页面文本主体篇幅较小，可能被搜索算法判定为附加价值较低的简单复制页。
- **修复方案**：
  补充 150-250 字的深入描述，涵盖核心优势（如 Snipaste 的贴图交互、Ditto 的多机剪贴板同步原理等）。
- **验收方法**：
  后台字数统计均达到 150 字以上。

---

### ISSUE-P2-04：软件详情页未反向关联相关教程，内链闭环单向化

- **问题级别**：P2（中度体验与丰富度）
- **影响范围**：软件详情页模板
- **根本原因**：
  前端与 SSR 模板中，教程页会推荐「配套软件」，但软件页**没有展示「相关技巧与教程」列表**。
- **负面影响**：
  用户下载软件后即可能流失，未能引导至本站深度教程，用户停留时间偏短，页面间链接跳出率偏高。
- **修复方案**：
  在 `SoftwareDetail` 组件与 SSR HTML 中，增加「配套教程与实操技巧」板块，自动拉取 `softwareId` 匹配的已发布教程。
- **验收方法**：
  访问 `https://softtribe.top/software/7zip`，页面下方展示《7-Zip 高强度 AES-256 加密与防暴力破解实战》的推荐卡片。

---

## 四、P3 细节与长效优化问题清单（3 项）

### ISSUE-P3-01：缺乏 `llms.txt` 标准文件，生成式 AI 知识发现效率受限

- **问题级别**：P3（细节与长效优化）
- **影响范围**：站点级 AEO 规范
- **根本原因**：
  根目录下未配置符合行业标准的 `llms.txt` 与 `llms-full.txt`。
- **负面影响**：
  新型 AI 智能体（如 Cursor、Claude Artifacts、Perplexity 检索器）在解析网站时需自行探索 Sitemap，效率不如直接读取 `llms.txt` 精确。
- **修复方案**：
  在 Fastify 中增加 `/llms.txt` 路由，以 Markdown 格式清晰列明软游部落的品牌定位、核心原则（100%官方直链/无捆绑）、七大频道结构及 50 款软件与 27 篇教程的快速索引。
- **验收方法**：
  `curl -i https://softtribe.top/llms.txt` 返回 Content-Type: `text/plain; charset=utf-8` 的 Markdown 摘要。

---

### ISSUE-P3-02：Title 标签长度偏长（平均 42 字符），移动端存在省略号截断

- **问题级别**：P3（细节与长效优化）
- **影响范围**：50 款软件页面
- **根本原因**：
  模板形如：`{name} {version} 官方下载渠道与版本信息 - {category} - 软游部落`。在字符限制较严格的移动端搜索结果（约 30-32 字符）中，尾部的核心品牌名易被截断为 `...`。
- **修复方案**：
  精简优化为：`{name} {version} 官方下载 - {category}最新版 - 软游部落`，控制在 30 字符内，同时突出「官方下载」与「最新版」两大主转化词。
- **验收方法**：
  检查生成的 HTML `<title>` 长度在 24-32 汉字区间，百度移动端预览无异常截断。

---

### ISSUE-P3-03：静态资源 Cache-Control 头与现代图片格式兜底优化

- **问题级别**：P3（细节与长效优化）
- **影响范围**：站点前端性能
- **根本原因**：
  软件图标大部分为 PNG/ICO 格式，部分图标未提供 AVIF/WebP 格式压缩。
- **负面影响**：
  在移动弱网环境下，首屏图标加载消耗微量额外流量。
- **修复方案**：
  统一构建流程，对所有存量软件图标进行 WebP 转换，并配置 Nginx 对静态图片设置长期缓存 `Cache-Control: public, max-age=2592000, immutable`。
- **验收方法**：
  Network 面板检查图片格式均为 WebP，响应头包含 immutable 缓存标记。

---

## 五、问题优先级全景汇总矩阵

| 序号 | 问题 ID | 级别 | 核心问题简述 | 责任模块 | 预期整改耗时 |
| :---: | :---: | :---: | :--- | :--- | :---: |
| 1 | **ISSUE-P0-01** | **P0** | Nginx 代理正则末尾 `$` 阻断详情页 SSR 直出 | Nginx 网关配置 | 0.5 天 |
| 2 | **ISSUE-P0-02** | **P0** | 2 篇教程正文为极短存根占位符 (<20字) | 内容编辑/发布 | 1.0 天 |
| 3 | **ISSUE-P0-03** | **P0** | 8 篇正式教程内链指向未发布草稿软件 (404) | 资源审核 / 前端模板 | 1.5 天 |
| 4 | **ISSUE-P0-04** | **P0** | 3 款系统镜像工具零下载来源待合规修复 | 资源运营 / 官方直链 | 0.5 天 |
| 5 | **ISSUE-P1-01** | **P1** | `sitemap-software.xml` 输出 47 款软件的 `/tool/` 别名重复条目 | Fastify 后端 | 0.5 天 |
| 6 | **ISSUE-P1-02** | **P1** | 10 篇实操教程字数过短 (140-250字) 缺乏深度步骤 | 内容编辑 / 扩写 | 2.0 天 |
| 7 | **ISSUE-P1-03** | **P1** | Nginx 爬虫 UA 白名单未放行主流 AI 搜索引擎蜘蛛 | Nginx 网关配置 | 0.5 天 |
| 8 | **ISSUE-P1-04** | **P1** | `sitemap-essentials.xml` 与 `sitemap-topics.xml` 重复收录 6 个专题 | Fastify 后端 | 0.5 天 |
| 9 | **ISSUE-P2-01** | **P2** | 缺少 `FAQPage` 与 `HowTo` 结构化数据 (JSON-LD) | Fastify SSR 服务 | 1.0 天 |
| 10 | **ISSUE-P2-02** | **P2** | 缺少 E-E-A-T 真实测试机硬件环境与审核资质卡片 | 前端组件 / SSR 模板 | 1.0 天 |
| 11 | **ISSUE-P2-03** | **P2** | 8 款软件官方描述短于 100 字符，信息深度不足 | 资源运营 / 元数据 | 0.5 天 |
| 12 | **ISSUE-P2-04** | **P2** | 软件详情页缺少反向关联「配套实操教程」模块 | 前端组件 / SSR 模板 | 1.0 天 |
| 13 | **ISSUE-P3-01** | **P3** | 根目录未部署 `llms.txt` 标准大模型知识发现文件 | Fastify 后端 / 静态文件 | 0.5 天 |
| 14 | **ISSUE-P3-02** | **P3** | 软件页 Title 模板过长 (42字符)，移动端易截断 | Fastify SSR 服务 | 0.5 天 |
| 15 | **ISSUE-P3-03** | **P3** | 部分存量图标未全面 WebP 化，缓存头未声明 immutable | 构建脚本 / Nginx | 0.5 天 |
