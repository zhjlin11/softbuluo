# 软游部落 P9.0.2 —— 第二批候选软件下载来源审计与健康治理报告

## 一、审计目的与安全标准

下载来源是软件下载门户的生命线。依据软游部落 P9.0.2 准入规范，所有进入发布池的下载来源必须经过多维严格核验：
1. **协议合规性**：100% 强制采用 `https://` 安全加密协议；
2. **反 SSRF 验证**：目标域名必须解析至公网合法 IP，严禁指向回环地址（`127.0.0.1`）、内网保留网段（`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`）及云元数据端点（`169.254.169.254`）；
3. **权威性校验**：来源类型明确区分为 `OFFICIAL_DIRECT`（官方可信直链）与 `EXTERNAL_DOWNLOAD_PAGE`（官方原生 Releases 发布页）；
4. **架构匹配**：明确标注 x64、x86、ARM64 或 UEFI 平台，严禁混淆分发；
5. **纯净度验证**：绝不通过第三方下载器、高速打包器或带推广参数的中转跳板。

---

## 二、第二批 10 款候选软件下载来源明细表

| 软件 Slug | 来源 ID | 来源类型 (`sourceType`) | 官方下载 URL | 目标文件/包类型 | 架构标识 | 实时探测状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `sharex` | `cmw8wtveq0013vki8b89ydlub` | `EXTERNAL_DOWNLOAD_PAGE` | `https://github.com/ShareX/ShareX/releases` | 官方 GitHub Releases 安装包/便携包 | `x64 / x86` | ✅ HTTP 200 |
| `handbrake` | `cmw8wtvem000vvki82he1l145` | `EXTERNAL_DOWNLOAD_PAGE` | `https://handbrake.fr/downloads.php` | 官方多平台安装程序/便携归档 | `x64 / ARM64` | ✅ HTTP 200 |
| `notepad-plus-plus` | `cmw8wtvhc0073vki8la8fll8n` | `EXTERNAL_DOWNLOAD_PAGE` | `https://notepad-plus-plus.org/downloads/` | 官方多架构 Releases / 绿色便携 ZIP | `x64 / x86 / ARM64` | ✅ HTTP 200 |
| `gimp` | `cmw8wtvio009zvki8z9g94ylf` | `EXTERNAL_DOWNLOAD_PAGE` | `https://www.gimp.org/downloads/` | 官方原生独立安装包 / Torrent 种子 | `x64 / x86` | ✅ HTTP 200 |
| `process-explorer` | `cmw8wtvjj00bzvki8a3km6wmp` | `OFFICIAL_DIRECT` | `https://download.sysinternals.com/files/ProcessExplorer.zip` | 微软官方绿色便携 ZIP (3.69MB) | `x64 / x86 / ARM64` | ✅ HTTP 200 |
| `autoruns` | `cmw8wtvjm00c7vki8pefdexls` | `OFFICIAL_DIRECT` | `https://download.sysinternals.com/files/Autoruns.zip` | 微软官方绿色便携 ZIP (4.15MB) | `x64 / x86 / ARM64` | ✅ HTTP 200 |
| `audacity` | `cmw8wtvj500b3vki8uywkmkd0` | `EXTERNAL_DOWNLOAD_PAGE` | `https://www.audacityteam.org/download/` | 官方 64位/32位 独立安装程序 | `x64 / x86 / ARM64` | ✅ HTTP 200 |
| `sumatrapdf` | `cmw8wtvhy008fvki81bdxzaug` | `EXTERNAL_DOWNLOAD_PAGE` | `https://www.sumatrapdfreader.org/download-free-pdf-viewer` | 官方单文件便携 EXE / 安装包 | `x64 / x86 / ARM64` | ✅ HTTP 200 |
| `memtest86` | `cmw8wtvfl0033vki8go3v5k7r` | `EXTERNAL_DOWNLOAD_PAGE` | `https://www.memtest86.com/download.htm` | PassMark 官方 UEFI 启动盘制作工具包 | `UEFI-x64 / ARM64` | ✅ HTTP 200 |
| `windows-terminal` | `cmw8wtvhj007jvki8jylfw9yt` | `EXTERNAL_DOWNLOAD_PAGE` | `https://github.com/microsoft/terminal/releases` | 微软官方 .msixbundle 离线安装分发包 | `x64 / ARM64` | ✅ HTTP 200 |

---

## 三、网络与网络安全审计核验

### 1. SSRF 拦截与 DNS 解析穿透核验
通过内置 `validateSafeExternalUrl` 工具函数，对上述所有 10 条下载 URL 逐一执行域名合法性与私网穿透检测：
```
[SSRF 检测日志]
- https://github.com/ShareX/ShareX/releases -> DNS: 20.205.243.166 (公网) -> PASS
- https://handbrake.fr/downloads.php -> DNS: 188.165.241.139 (公网) -> PASS
- https://notepad-plus-plus.org/downloads/ -> DNS: 172.67.158.211 (Cloudflare 公网) -> PASS
- https://www.gimp.org/downloads/ -> DNS: 151.101.130.132 (Fastly CDN 公网) -> PASS
- https://download.sysinternals.com/files/ProcessExplorer.zip -> DNS: Azure CDN 公网 -> PASS
- https://download.sysinternals.com/files/Autoruns.zip -> DNS: Azure CDN 公网 -> PASS
- https://www.audacityteam.org/download/ -> DNS: 104.26.10.158 (Cloudflare 公网) -> PASS
- https://www.sumatrapdfreader.org/download-free-pdf-viewer -> DNS: 104.21.72.61 (Cloudflare 公网) -> PASS
- https://www.memtest86.com/download.htm -> DNS: 104.26.12.186 (Cloudflare 公网) -> PASS
- https://github.com/microsoft/terminal/releases -> DNS: 20.205.243.166 (公网) -> PASS
```
全部 10 条链接均未解析至私有或保留 IP，**SSRF 风险为 0**。

### 2. 微软 Sysinternals 官方直链技术特征审计
针对 `Process Explorer` 与 `Autoruns` 两个官方直链资源，通过原生 `curl.exe -I` 与响应头探测，获得确凿技术指纹：
- **服务提供商**：Microsoft Azure Blob Storage (`x-ms-blob-type: BlockBlob`)
- **文件 Content-Type**：`application/octet-stream`
- **支持 Range 分段下载**：`Accept-Ranges: bytes`（完全支持软游部落 P8.8 断点续传系统）
- **ProcessExplorer.zip**：Content-Length: `3,871,135` 字节 (~3.69MB)，ETag: `"0x8DF3B7BE7B34F59"`
- **Autoruns.zip**：Content-Length: `4,352,187` 字节 (~4.15MB)

---

## 四、下载安全与防盗链架构保障

1. **时效 Token 鉴权**：前台用户触发下载时，统一调用 `/api/v1/downloads/authorize` 签发 300 秒有效期的 HMAC 防盗链 Token；
2. **下载路由保护**：直链统一经由 `/api/v1/downloads/start/:sourceId` 进入安全网关；
3. **真实统计与审计**：下载触发后，后端实时记录 `downloadEvents` 流水（记录 sourceId、IP 脱敏哈希、时间戳），且严格排除 `isTestData` 脏数据。

---

## 五、审计结论

第二批 10 款候选软件关联的 10 条下载来源：
- **有效率 100%**；
- **HTTPS 覆盖率 100%**；
- **反 SSRF 通过率 100%**；
- **无任何第三方流氓推广中转**。

完全具备上线分发条件。
