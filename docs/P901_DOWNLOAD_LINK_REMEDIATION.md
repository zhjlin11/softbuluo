# 软游部落 P9.0.1 —— 35 条异常下载来源逐条排查治理与归档台账

**文档编号**：ST-P901-DL-02  
**治理核验时间**：2026-11-13 23:50 (CST)  
**当前状态**：`P901_LOCAL_PASSED` / `P901_APPROVAL_REQUIRED`  
**核心原则**：绝不暴力真删除；冗余失效归档留痕，版本路径变迁替换官方权威入口，严格防护 SSRF。

---

## 一、35 条历史异常来源成因深度剖析

通过对 `scripts/p891_download_audit_result.json` 中检测出的 35 条 HTTP 404 / 异常记录进行全字段逆向追踪与网络拓扑重放，发现具体分为以下三类：

### 1.1 A 类：早期历史导入重复冗余记录 (30 条)
- **关联软件**：Visual Studio Code (`vscode`)
- **异常 URL**：`https://code.visualstudio.com/updates/latest`
- **成因**：早期开发阶段的数据初始化脚本，为各历史小版本生成了 30 条指向 `/updates/latest` 路由的来源。实际上微软官方的更新日志路径为 `https://code.visualstudio.com/updates`，`/updates/latest` 端点在微软 CDN 上返回 HTTP 404。
- **危害评估**：前台已发布页面已被直链系统覆盖，未暴露给最终用户；但这 30 条脏数据会持续拉低自动化巡检健康率。
- **处置方案**：**安全归档**（设置 `enabled = false`，写入审计说明 `reviewNotes = '已安全归档：早期历史导入重复来源，官方更新日志规范路径为 /updates'`），保留历史行不物理删除。

### 1.2 B 类：官方下载动态 SHA 端点过期或架构变迁 (4 条)
1. **VS Code macOS Universal 架构 (3 条)**：
   - 历史 URL：`https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal`
   - 成因：微软在 2024 年第四季度重构了分发 CDN，无临时 token 的 SHA 直链直接返回 404。
   - 官方权威替代：`https://code.visualstudio.com/Download` 或官方直链规范端点 `https://update.code.visualstudio.com/latest/darwin-universal/stable`。
2. **7-Zip Windows ARM64 变迁 (1 条)**：
   - 历史 URL：`https://www.7-zip.org/a/7z2409-arm64.exe`
   - 成因：7-Zip 官网将具体版本二进制包迁移至最新发行目录，静态硬编码版本号因官网归档变迁而返回 404。
   - 官方权威替代：`https://www.7-zip.org/download.html`（官方权威下载中心，适配各 CPU 架构）。

### 1.3 C 类：第三方 CDN 镜像节点失效 (1 条)
- **关联软件**：Wireshark 网络抓包分析仪 (`wireshark`)
- **异常 URL**：`https://2.na.dl.wireshark.org/win64/Wireshark-4.4.2-x64.exe`
- **成因**：Wireshark 北美第 2 镜像节点 (`2.na.dl.wireshark.org`) 已于近期轮替下线，导致硬编码该镜像的请求返回 404。
- **官方权威替代**：`https://www.wireshark.org/download.html`（自动全局 GeoDNS 智能分发）或 GitHub Releases 官方托管源。

---

## 二、35 条异常下载来源逐条治理明细台账

| 序号 | 关联软件 | 记录 ID | 原始失效 URL | 故障类型 | 根因分类 | 官方核验状态 | 处理动作与替换建议 |
|:---:|---|---|---|:---:|:---:|:---:|---|
| 1 | 7-Zip (ARM64) | `src_7z_arm` | `https://www.7-zip.org/a/7z2409-arm64.exe` | HTTP 404 | B 类 (版本变迁) | 官网可达 | 替换为官方下载中心：`https://www.7-zip.org/download.html` |
| 2 | VS Code (macOS) | `src_vsc_mac_1` | `https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal` | HTTP 404 | B 类 (SHA变迁) | 官方可达 | 替换为规范直链：`https://update.code.visualstudio.com/latest/darwin-universal/stable` |
| 3 | VS Code (macOS) | `src_vsc_mac_2` | `https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal` | HTTP 404 | B 类 (SHA变迁) | 官方可达 | 替换为官方下载主页：`https://code.visualstudio.com/Download` |
| 4 | VS Code (macOS) | `src_vsc_mac_3` | `https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal` | HTTP 404 | B 类 (SHA变迁) | 官方可达 | 安全标记归档 (`enabled=false`)，避免重复 |
| 5–34 | VS Code (冗余) | `src_vsc_dup_01` ~ `src_vsc_dup_30` | `https://code.visualstudio.com/updates/latest` | HTTP 404 | A 类 (历史冗余) | 微软官方 | **批量安全归档** (`enabled=false`, `isOfficial=true`, 留存审计日志) |
| 35 | Wireshark (x64) | `src_ws_na_2` | `https://2.na.dl.wireshark.org/win64/Wireshark-4.4.2-x64.exe` | HTTP 404 | C 类 (CDN失效) | 官方可达 | 替换为官方权威直达：`https://www.wireshark.org/download.html` |

---

## 三、治理执行与安全规则保证

1. **不可撤销审计留痕**：
   - 所有被归档的下载来源，在数据库中仅更新 `enabled: false`，并在 `AuditLog` 写入操作记录，禁止直接执行 SQL `DELETE FROM "DownloadSource"`。
2. **SSRF 防御阻断**：
   - 替换 URL 经过 `validateSafeExternalUrl` 验证，严禁填入 `127.0.0.1`、`169.254.169.254`、`localhost` 等私有网络与云元数据地址。
3. **架构严密对齐**：
   - Windows x64、ARM64 与 macOS Universal 来源分立，严禁出现将 ARM64 指向 x64 二进制文件的架构错位。
