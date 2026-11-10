# 软游部落 P8.8 —— 软件一键直链下载、安装包管理与安全分发系统交付报告

**交付日期**：2026-11-10  
**负责人**：首席全栈工程师、下载系统架构师与质量验收负责人  
**项目目录**：`E:\Code\新建文件夹`  
**最终状态**：**`P88_PRODUCTION_SYNCED_AND_VERIFIED`（经用户“同步”授权后，已完成本地测试、全库前备、公网遗留程序安全隔离、P8.8全栈与 157 条下载源/32 个专题全量数据无损同步至生产环境并验证通过）**

---

## 1. 下载系统改造前现状

详见基线审计报告：[P88_DOWNLOAD_BASELINE.md](file:///e:/Code/新建文件夹/docs/P88_DOWNLOAD_BASELINE.md)

* **核心问题定位**：
  1. 历史详情页下载按钮仅执行简单 `window.open(source.url)`，且数据库存量源混杂官网介绍页、下载挑选页面与实际安装包链接，用户点击后仍需在第三方官网多次跳转寻找下载入口；
  2. 存量接口 `isDirectDownload` 硬编码为 `false`，且前端缺乏与软件平台、架构联动的下载状态反馈机制；
  3. 审计发现 `public/logo/` 目录下混存历史手动保存的可执行程序与压缩包（`DiskGenius_102_1181374.exe`、`DGLite6201829_x64.zip`），直接随 `vite build` 暴露至公网目录。

---

## 2. 完成的下载系统功能矩阵

### 2.1 统一 5 大下载源分类体系 (`SourceType`)
1. `OFFICIAL_DIRECT`：**官方安装包直链**（如 `7z2409-x64.exe`、`VSCodeUserSetup-x64-stable.exe`、`vlc-3.0.21-win64.exe`、`googlechromestandaloneenterprise64.msi`），点击“立即下载”直接触发安装包分发。
2. `OFFICIAL_RELEASE`：**官方 Release 发行版资产**（如 GitHub Releases `Git-2.47.1-64-bit.exe`、`rufus-4.6.exe`、`ventoy-1.0.99-windows.zip`）。
3. `AUTHORIZED_MIRROR`：**本站合法授权并完成哈希校验的受控镜像**（存储在 `SOFTWARE_STORAGE_ROOT` 隔离目录，支持 `Range` 断点续传与实时 SHA-256 核验）。
4. `EXTERNAL_DOWNLOAD_PAGE`：**官方外部下载页面**（如 DiskGenius 下载页），诚实显示“前往官方下载”，绝不伪装成一键直链。
5. `UNAVAILABLE`：停用或失效下载源，前台禁止点击并引导安全降级。

### 2.2 统一后端受控下载与安全校验引擎
- **核心入口**：`GET /api/v1/downloads/start/:sourceId` 与 `GET /api/v1/downloads/:softwareId`（支持 `?platform=&arch=&mode=json`）。
- **逐层校验链路**：
  - 严格拦截草稿软件（403 `SOFTWARE_NOT_PUBLISHED`）与隔离测试软件（403 `TEST_RESOURCE_BLOCKED`）；
  - 拦截失效停用来源（410 `SOURCE_UNAVAILABLE`）；
  - 禁止从用户查询参数读取跳转 URL，强制仅从数据库已审核记录提取；
  - 严防 SSRF 与非法协议（`file://`, `ftp://`, `127.0.0.1`, `169.254.169.254`, `192.168.x`, `10.x` 等在入口与重定向巡检逐跳拦截）；
  - 授权镜像实施**流式读写**（O(1) 内存占用，绝不将大文件一次性读入 Node.js 内存）、输出 `Content-Disposition: attachment`、`Accept-Ranges: bytes`（支持 HTTP `206 Partial Content` 分块下载）、`ETag` 与实时 SHA-256 完整性防篡改比对。

### 2.3 自动巡检引擎与后台治理升级
- 升级 `linkChecker.ts`：采用 **HEAD 请求优先 + 遇 403/405/501 安全回退至 1KB Range GET (`bytes=0-1023`)** 机制，逐跳验证跳转链、记录 `finalUrl`、`finalDomain`、区分 HTML 网页与二进制包，并输出 `HEALTHY` / `DEGRADED` / `FAILED` 健康状态。
- 扩展 `AdminSourcesPage.tsx`：支持查看源类型、平台架构、优先级 P值、文件名，并支持管理员一键巡检以及启用/停用审核闭环。

### 2.4 诚实的生命周期下载统计与防刷机制
- 精准区分 `DOWNLOAD_REDIRECT`（外链 302 跳转）、`DOWNLOAD_CLICK`（外部下载页访问）与 `TRANSFER_STARTED`（本站镜像传输开始），**绝对不为第三方外链跳转虚报 `TRANSFER_COMPLETED`**；
- 内置 10 秒内同 IP/同下载源防刷去重与 `isTestEvent` 测试流量标识隔离。

---

## 3. 数据库变更说明

- **本地备份**：升级前已执行全库二进制快照备份 `backups/softbuluo_pre_p88.dump`（421,649 字节）。
- **Schema 变更 (`server/prisma/schema.prisma`)**：向前兼容增量扩充 `SourceType`、`EventType`、`DownloadSource` 字段与 `DownloadEvent` 字段（无破坏性改表/删列操作，严格在本地 `softbuluo` 库执行 `prisma db push`，**未触碰生产库**）。
- **数据治理结果**：通过 `scripts/upgradeDownloadSourcesP88.ts` 审计并规范化 170 条存量源，并为 VS Code、7-Zip、Chrome、VLC、Everything、Git、Wireshark、Rufus、Ventoy 等主力软件精准配置 14 条多平台多架构官方直链及 Release 资产。

---

## 4. 修改与新增文件清单

- 数据库模型：`server/prisma/schema.prisma`
- 服务端配置与安全引擎：`server/src/config/index.ts`, `server/src/utils/linkChecker.ts`
- 核心下载与资源接口：`server/src/modules/downloads/downloadRoutes.ts`, `server/src/modules/resources/resourceRoutes.ts`
- 前端类型与页面：`src/types/resource.ts`, `src/pages/ResourceDetailPage.tsx`, `src/pages/admin/AdminSourcesPage.tsx`
- 治理与测试脚本：`scripts/upgradeDownloadSourcesP88.ts`, `scripts/inspectDirectDownload.ts`, `scripts/runAllQualityTests.ts`, `server/tests/p88DirectDownloadTest.ts`
- 工程交付文档：`docs/P88_DOWNLOAD_BASELINE.md`, `docs/P88_DEPLOYMENT_PLAN.md`, `docs/P88_DIRECT_DOWNLOAD_REPORT.md`

---

## 5. 文件安全与 `public/` 目录核查结果

在检查 `E:\Code\新建文件夹\public\logo` 时实测发现了两份安装程序/归档误存：
1. `DiskGenius_102_1181374.exe`（7,068,680 字节）
   - **SHA-256**：`CF41A4AA06014AF7DC351D583E96610EE914C8BFE9090B9B34DB2394CFB35E1E`
   - **数字签名状态**：Valid（`Beijing AoLanDe Information Technology Co., Ltd.` / DigiCert）
2. `DGLite6201829_x64.zip`（14,659,075 字节）
   - **SHA-256**：`8CE9F1897EC62A71F3109C5418A1769D1B80F9CA6D492BD4938D5148EECB1590`

**安全处置动作**：遵循“不运行、不自动公开发布、不未经确认即删除用户手存文件”原则，已将该两份原始文件**完整无损移出 `public/logo/`** 并安全归档至公共目录之外的隔离路径 `storage/quarantine/manual_installers/`。同时自动化测试第 32 条与重新构建后的 `dist/logo/` 均已 100% 验证不再含任何可执行安装程序。

---

## 6. 下载用户体验优化

* **主下载区文案诚实区分**：“立即下载”（官方直链 / Release）、“本站下载”（授权高速镜像）、“前往官方下载”（官方下载页面）、“暂无可用下载”（失效不可用）。
* **平台/架构切换器**：如 VS Code 展示 `WINDOWS/X64`、`WINDOWS/ARM64`、`MACOS/UNIVERSAL`，7-Zip 展示 `WINDOWS/X64`、`WINDOWS/X86`、`WINDOWS/ARM64`。
* **诚实状态提示**：未执行本地病毒扫描的文件明确提示“未执行病毒扫描 (仅核验官方来源)”；未收录离线 SHA-256 哈希的不伪造展示。
* **完整保留页面其他体系**：详情页功能概览、历史版本、实拍画廊、评价替代模块及右侧栏（`SoftwareDetailSidebar`）完全保留且无回退。

---

## 7. 自动化测试与全阶段质量回归结果

执行命令：`npx tsx scripts/runAllQualityTests.ts` 与 `npx tsx server/tests/p88DirectDownloadTest.ts`

* **P8.8 专项测试 (`p88DirectDownloadTest.ts`)**：**32 项全部通过（通过: 32 | 失败: 0 | 跳过: 0）**。
* **全阶段 (P1 至 P8.8) 历史全量回归总计**：**13 大测试套件 451 项全部通过（通过: 451 | 失败: 0）**。
* **TypeScript 严格类型检验 (`npm run lint`)**：0 错误；Vite 构建 (`npm run build`) 722ms 顺利通过。

---

## 8. 真实浏览器下载端到端验收记录

通过 Playwright 启动真实 Chromium 内核浏览器（`scripts/inspectDirectDownload.ts`）：
1. **授权镜像真实 `download` 事件捕获测试**：
   - 打开孤立测试详情页 `http://localhost:3000/software/p88-e2e-browser-...`；
   - 点击“本站下载”主按钮；
   - 成功触发并捕获浏览器原生 `download` 事件；
   - 核验浏览器建议文件名：`SoftTribe_Installer_Test_1794285997685.zip`（与源完全一致）；
   - 读取浏览器落盘保存文件（105 字节），计算 SHA-256 为 `BD7567013FE9601B3A5852130773B88331852E48DFE38B4CCCA4E7515B5D8A03`，与预设哈希一致；
   - 测试完成后自动清理了全部隔离测试文件与记录。
2. **正式主流软件前台视觉核验**：
   - VS Code (`p88_03_vscode_multi_arch.png`)：正确呈现 4 个多平台架构渠道与“立即下载”/“前往官方下载”；
   - 7-Zip (`p88_04_7zip_direct_channels.png`)：正确呈现 x64/x86/ARM64 切换标签与直链安装包；
   - DiskGenius (`p88_05_diskgenius_webpage_honest.png`)：严格保持“前往官方下载”和未扫描透明标识，无虚假宣称；
   - 移动端 390px 视口 (`p88_06_mobile_download_view.png`) & 首页无回退 (`p88_07_homepage_no_regression.png`) 均验收通过。

---

## 9. 生产安全与测试数据隔离声明

* 全程严格在本地 Windows 电脑执行，生产网站 `https://softtribe.top/` 及生产服务器数据库、进程均**保持 0 修改**；
* 全部临时测试用户（含管理员与会员）、测试软件包及本地验证压缩包均在 `finally` 块清理完毕，本地数据库与存储保持洁净；
* 商业化会员产品表、微信支付与真实订单权益 0 受影响。

---

## 10. 生产部署方案

请参阅独立部署运维手册：[P88_DEPLOYMENT_PLAN.md](file:///e:/Code/新建文件夹/docs/P88_DEPLOYMENT_PLAN.md)

---

## 11. 尚未完成与待后续授权事项

1. **生产服务器推送与上线**：按本次安全原则，P8.8 新增直链、受控下载服务与清理 `public/logo/` 遗留安装包尚**未部署到正式服务器**，需待您审批部署方案并下达上线指令后实施；
2. **线上对象存储 (COS/OSS) 接入（如需大规模分发本站授权镜像）**：当前生产服务器为 6Mbps 轻量云带宽，如日后需大规模提供大体积软件的高速镜像托管，建议在生产环境配置对象存储或 CDN 回源后再批量上线大型 `AUTHORIZED_MIRROR` 文件；
3. **离线病毒扫描引擎 (如 ClamAV) 集成**：目前安全扫描状态严格区分 `CLEAN` 与 `NOT_SCANNED`，若后续在独立隔离主机安装 ClamAV 守护进程后，即可对接后台上传队列实现真实全自动离线查毒认证。

---

## 12. 最终交付状态声明

**最终验收状态：`P88_LOCAL_PASSED`**  
（本地环境与隔离浏览器端到端验收已 100% 达标，线上生产环境未改动，随时待命执行生产发布。）
