# 软游部落 P8.9 下载通道与来源安全真实度专项审计报告

## 一、审计背景与审核准则

下载通道是软游部落（SoftTribe）的核心业务命脉。本次审计针对全站 **30 款已发布核心软件、系统工具与游戏** 所关联的 **47 条有效下载来源** 进行了逐条网络探活、协议安全性、域名可信度与安全分级判定。

依照审慎原则，全站下载渠道安全分级定义如下：

| 等级 | 分级定义 | 准入门槛与核验依据 | 实测数量 | 占比 |
| :---: | :--- | :--- | :---: | :---: |
| **Level 1** | **仅登记外部链接** | 系统收录外部官方或第三方发布页，尚未完成全量人工巡检 | 9 条 | 19.1% |
| **Level 2** | **链接实测可访问** | 实测 HTTP 状态码 200~399，目标地址稳定可达 | 4 条 | 8.5% |
| **Level 3** | **人工审核来源** | 运营团队已完成人工来源审核（审核状态为 `APPROVED` / `VERIFIED`） | 28 条 | 59.6% |
| **Level 4** | **官方或授权分发渠道** | 链接归属于软件著作权人官方主站（如 `code.visualstudio.com`, `voidtools.com`） | 6 条 | 12.8% |
| **Level 5** | **文件 SHA-256 完整性核验** | 数据库中已录入经原厂比对的 64 位 SHA-256 指纹，提供校验依据 | **0 条** | 0.0% |
| **Level 6** | **文件数字签名有效性验证** | 实际解包比对可执行程序的微软 Authenticode 数字证书并确认合规 | **0 条** | 0.0% |

> [!IMPORTANT]
> **真实度警示**：全站 47 条下载来源中，Level 5 (SHA-256) 与 Level 6 (数字签名) 实际存量均为 **0 条**。历史上前端部分宣传文案存在“全量 SHA-256 防篡改”的虚标表述，已于本次 P8.9 彻底修正为“官方来源人工审查 · 安全直连通道”，严禁将 1~4 级夸大标注为 5~6 级。

---

## 二、下载来源基础安全指标

- **审计来源总数**：47 条
- **HTTPS 传输协议覆盖率**：**47/47 (100.0%)**（所有下载渠道均强制运行在 HTTPS 加密通道下，无任何明文 HTTP 隐患）
- **当前实测可达率 (200~399)**：**33/47 (70.2%)**
- **官方主站与权威发布页覆盖率**：**22/47 (46.8%)**
- **内网/敏感地址 (SSRF 风险)**：**0 条**（所有目标 URL 均严格通过 SSRF 黑名单过滤）

---

## 三、30 款核心软件下载来源抽样审计清单

| 软件名称 | 所属分类 | 来源名称 | 来源类型 | 实测 HTTP 状态 | 官方域名 | 安全等级 | 审计说明 |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Visual Studio Code** | 电脑软件 | 官方用户安装包 | OFFICIAL_DIRECT | 200 | ✅ 是 | Level 4 | 来自 `code.visualstudio.com` 官方直链 |
| **7-Zip** | 系统工具 | 官方 64位安装包 | OFFICIAL_DIRECT | 200 | ✅ 是 | Level 4 | 来自 `7-zip.org` 官方直链 |
| **Everything** | 系统工具 | voidtools 官方便携版 | OFFICIAL_DIRECT | 200 | ✅ 是 | Level 4 | 来自 `voidtools.com` 官方渠道 |
| **Rufus** | 系统工具 | GitHub Release 直链 | OFFICIAL_DIRECT | 302 | ✅ 是 | Level 4 | 重定向至 GitHub Releases CDN |
| **Geek Uninstaller** | 系统工具 | 官网直接下载 | OFFICIAL_DIRECT | 200 | ✅ 是 | Level 4 | 来自 `geekuninstaller.com` |
| **CrystalDiskInfo** | 系统工具 | 官方标准安装版 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方发布页人工审核入库 |
| **Bandizip** | 系统工具 | Bandisoft 官方中文版 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方正版下载页引导 |
| **Snipaste** | 电脑软件 | 微软商店与独立版 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方分发页引导 |
| **Obsidian** | 电脑软件 | 官方桌面安装版 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 跨平台官方分发页 |
| **PotPlayer** | 电脑软件 | 官方 64位版本 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方稳定版渠道 |
| **Wireshark** | 系统工具 | 官方稳定发布版 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方安全镜像 |
| **PuTTY** | 系统工具 | 官方 SSH 终端单文件 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 官方作者发布页 |
| **OpenRA** | 游戏中心 | 官方跨平台启动包 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 开源游戏官方 Releases |
| **Endless Sky** | 游戏中心 | GitHub 官方发布页 | EXTERNAL_DOWNLOAD_PAGE | 200 | ✅ 是 | Level 3 | 开源游戏官方资产 |

---

## 四、下载 API 与防刷安全机制

软游部落部署了统一的下载中继与分发接口：`GET /api/v1/downloads/:id/file` 与 `GET /api/v1/downloads/:id/official-link`。

1. **草稿隔离控制**：当关联软件处于 `DRAFT` 或 `isTestData: true` 状态时，API 严格阻断并返回 `404 资源未发布`，无法通过直接拼接 ID 窃取未公开软件。
2. **下载流式代理与防盗链**：
   - 本地托管安装包支持 HTTP Range 分段断点续传。
   - 响应头自动注入 `X-Robots-Tag: noindex, nofollow`，防止搜索引擎蜘蛛错误将临时下载重定向当成落地页索引。
3. **SSRF 安全防护**：
   - 探活与中继服务严格内置 `isPrivateIp` 过滤：阻断 `127.0.0.1`, `localhost`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (云元数据接口)。
   - 禁止重定向至内网主机。
