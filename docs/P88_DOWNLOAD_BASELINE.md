# 软游部落 P8.8 下载系统基线与现状深度审计报告

**审计日期**：2026-11-10  
**审计执行人**：软游部落首席全栈工程师、下载系统架构师与网络安全审计组  
**网站运行环境**：生产环境 `https://softtribe.top/` (腾讯云 Lighthouse)，本地开发 `http://localhost:3000/`  
**核心目标**：从“仅跳转官网首页/下载页”转变为“真正一键直链获取安装包、精准区分来源类型、安全防范恶意篡改与 SSRF”。

---

## 1. 现有下载系统能力盘点 (已有可复用资产)

| 功能模块 | 现有实现文件 / 接口 | 当前实际能力 | 评估结论 |
| :--- | :--- | :--- | :--- |
| **下载源模型** | `server/prisma/schema.prisma` (`model DownloadSource`) | 包含 `sourceType` (枚举仅 `OFFICIAL_EXTERNAL` 和 `LICENSED_HOSTED`), `url`, `fileId`, `verificationStatus`, `isActive`, `lastCheckedAt` | **结构完备但类型过于粗放**，无法区分“直接安装包直链”与“第三方中间网页” |
| **托管文件与签名** | `model HostedFile`, `model SignatureVerification` | 包含 `storageKey`, `sha256`, `sizeBytes`, `scanStatus`, `signerName`, `signatureStatus` | **高度解耦且已支持数字签名与安全扫描状态**，可直接复用于本地授权镜像能力 |
| **下载点击打点** | `POST /api/v1/downloads/track` | 记录 `softwareId`, `sourceId`, `eventType` (`OFFICIAL_LINK_CLICK`)，计算 IP 哈希防刷 | **可用**，但未能区分“点击”、“重定向”、“传输开始”与“完成” |
| **下载授权令牌** | `POST /api/v1/downloads/authorize` | 签发 120 秒高熵 Token 并进行 SHA-256 哈希比对 | **安全机制完备**，适用于站内授权镜像的高安全防盗链 |
| **流式分发服务** | `GET /api/v1/downloads/file` | 通过 ReadStream 分发站内物理文件，返回 `attachment` 响应头 | **核心逻辑可用**，但缺少对 `Range` 分块下载协议与对象存储预签名支持 |
| **前端下载交互** | `src/pages/ResourceDetailPage.tsx` (`handleDownload`) | 简单通过 `window.open(source.url, '_blank')` 弹窗新标签页 | **严重痛点**：用户点击后被带到官网首页或下载列表页，必须二次或三次寻找下载入口 |
| **后台下载源管理** | `src/pages/admin/AdminOfficialSourcesPage.tsx` | 支持查看与审核官方外链、测试 URL 响应 | **可用**，但缺乏来源类型细化选择（如官方直链、Release 资产、下载网页） |

---

## 2. 核心缺失与错误实现分析

### 痛点 1：下载源 URL 混淆“官网首页”、“产品介绍页”与“真实安装包直链”
- **现状**：经数据库实际抽样审查，大多数软件的 `url` 仅配置为官网的中间网页：
  - VS Code：`https://code.visualstudio.com/Download`（下载选择页）
  - 7-Zip：`https://www.7-zip.org/download.html`（下载列表页）
  - Google Chrome：`https://www.google.cn/chrome/`（产品介绍主页）
  - Everything：`https://www.voidtools.com/downloads/`（下载列表页）
  - CPU-Z：`https://www.cpuid.com/softwares/cpu-z.html`（产品页）
- **影响**：用户点击“立即下载”后并没有立即触发文件下载，而是跳入第三方英文或中文复杂的页面，体验与成熟下载门户严重脱节。

### 痛点 2：缺少统一、受控的后端一键直达入口
- **现状**：前端直接在客户端执行 `window.open(source.url)`，缺少集中的“安全协议检查”、“域名白名单比对”、“SSRF 阻断”与“官方直链自动分发路由”。
- **目标**：建立统一受控入口 `GET /api/v1/downloads/start/:sourceId` 与 `GET /api/v1/downloads/:softwareId`，由后端判定来源类型并执行 302/307 官方直链重定向、Release 资产解析或流式文件分发。

### 痛点 3：前端静态 `public/logo/` 目录存在安装包泄露隐患
- **现状审查**：在 `public/logo/` 目录下发现了两份遗留的可执行文件与压缩包：
  1. `DiskGenius_102_1181374.exe` (7,068,680 字节, SHA-256: `CF41A4AA06014AF7DC351D583E96610EE914C8BFE9090B9B34DB2394CFB35E1E`, 数字签名 Valid: 北京傲朗德信息技术有限公司)
  2. `DGLite6201829_x64.zip` (14,659,075 字节, SHA-256: `8CE9F1897EC62A71F3109C5418A1769D1B80F9CA6D492BD4938D5148EECB1590`)
- **安全风险**：Vite 在执行 `npm run build` 时会将 `public/` 下的所有文件原样复制到 `dist/`，导致安装包变成无鉴权公开静态资产，且将安装包混在 Logo 目录下严重违反安全工程规范。
- **整改措施**：在保留原始文件完整性的前提下，将其安全移出 `public/`，归档至受控隔离目录 `storage/quarantine/manual_installers/`。

---

## 3. P8.8 整改方案与架构升级

1. **统一扩展 5 大下载源分类 (`SourceType`)**：
   - `OFFICIAL_DIRECT`：官方直链安装包（.exe / .msi / .zip / .dmg / .pkg），点击直接触发浏览器下载。
   - `OFFICIAL_RELEASE`：官方 Release 资产（如 GitHub Releases / Gitee Releases 官方编译附件）。
   - `AUTHORIZED_MIRROR`：站内授权加速镜像（已完成 SHA-256 校验与数字签名审查的合规安装包）。
   - `EXTERNAL_DOWNLOAD_PAGE`：官方外部下载页面（明确标示“前往官方下载”，不伪装直链）。
   - `UNAVAILABLE`：失效或未经审核来源（按钮禁用并提示安全降级）。

2. **新建后端受控下载分发引擎**：
   - 入口：`GET /api/v1/downloads/start/:sourceId`
   - 安全规则：协议白名单（严格限制 HTTPS/HTTP）、私网与 SSRF 阻断（禁止 `127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254` 等内网及元数据 IP）、重定向追踪防篡改。
   - 细化下载生命周期打点：`DOWNLOAD_CLICK` -> `DOWNLOAD_REDIRECT` -> `TRANSFER_STARTED` -> `TRANSFER_COMPLETED`。

3. **软件详情页前台体验升级**：
   - 根据源类型精准展示按钮：“立即下载（官方直链）”、“官方版本发布”、“前往官方下载页”或“本站高速下载”。
   - 架构与平台选择器（Windows x64 / x86 / ARM64, macOS, Linux）。
   - 文件指纹（SHA-256）与数字签名状态透明化展示。

4. **自动化测试与回归保障**：
   - 编写 `server/tests/p88DirectDownloadTest.ts` 覆盖 32 个核心安全与业务场景。
   - Playwright 真实浏览器端到端下载验收，校验下载事件、文件名与 SHA-256 指纹。
