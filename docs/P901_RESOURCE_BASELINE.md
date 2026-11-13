# 软游部落 P9.0.1 —— 真实软件资源基线与生产环境数据审计报告

**文档编号**：ST-P901-BASE-01  
**审计基准时间**：2026-11-13 23:45 (CST)  
**当前状态**：`P901_LOCAL_PASSED` / `P901_APPROVAL_REQUIRED`  
**执行角色**：首席全栈架构师 / 生产 DBA / 资源运营审核负责人  

---

## 一、审计背景与口径澄清

根据历史 P8.9、P8.9.1 及 P9.0 交付报告，项目存在多组统计口径（例如 47 条最新版本下载源 vs 97 条历史总下载源；30 款正式资源 vs 62 款草稿 vs 30 款测试资源）。本报告对**本地隔离数据库**与**线上生产数据库**（`134.175.230.107` / `vasto-postgres` / `softbuluo_prod`）进行了精准只读核验与物理盘点，彻底厘清口径差异。

### 1.1 核心数据盘点对比表

| 统计指标 | 本地开发隔离库 (`localhost:5432`) | 生产环境真实库 (`134.175.230.107`) | 口径解释与差异原因 |
|---|---:|---:|---|
| **软件资源总记录数 (`Software`)** | **92 款** | **123 款** | 生产库包含历史 P3/P8 迁移阶段保留的 30 款测试软件 (`isTestData = true` 且 `status = PUBLISHED`) 用于冷启动排查；本地库为纯净非测试库。 |
| **已正式公开发布真实软件 (`status=PUBLISHED, isTestData=false`)** | **30 款** | **30 款** | **两端完全一致**。涵盖 13 款电脑软件、15 款系统工具、2 款开源游戏。 |
| **已隔离历史测试软件 (`isTestData=true`)** | **0 款** | **30 款** | 生产端测试数据通过 `isTestData = true` 物理隔离，前台与 Sitemap 绝不展示。 |
| **待审核草稿储备 (`status=DRAFT, isTestData=false`)** | **62 款** | **63 款** | 生产环境多出 1 款历史重名草稿记录 (`vs-code`)，将在 P9.0.1 去重合并中核销。 |
| **真实教程已发布数 (`Tutorial`)** | **27 篇** | **27 篇** | **两端完全一致**。非测试教程 27 篇；生产库另含 17 篇历史测试标记教程 (`isTestData=true`)。 |
| **下载来源总记录数 (`DownloadSource`)** | **120 条** | **160 条** | 生产端多出的 40 条主要属于 30 款隔离测试软件关联的历史下载渠道。 |
| **最新发布版本有效下载源 (`isLatest = true`)** | **47 条** | **47 条** | **两端完全一致**。即前台详情页默认展示的首选直链/官网下载来源。 |
| **异常/待治理下载源 (`scripts/p891_download_audit_result.json`)** | **35 条** | **35 条** | 包含 30 条早期 VS Code 冗余更新端点、3 条旧 SHA 架构、1 条 7-Zip ARM64 版本变迁、1 条 Wireshark 镜像节点变更。 |

---

## 二、真实草稿软件资产透视 (62 款)

通过 `scripts/inspect_drafts.ts` 全量萃取，数据库当前 62 款草稿分为六大领域：

1. **系统工具与硬件检测 (35 款)**：
   - 核心精选：CrystalDiskInfo, CrystalDiskMark, CPU-Z, GPU-Z, Ventoy, MemTest86, Process Explorer, Autoruns, SpaceSniffer, TreeSize Free, HWMonitor, AIDA64, DDU 等。
2. **网络工程与远程连接 (7 款)**：
   - 核心精选：PuTTY, WinSCP, Nmap, FileZilla, Advanced IP Scanner, AnyDesk, RustDesk。
3. **办公与文件工具 (7 款)**：
   - 核心精选：FreeFileSync, WinMerge, PDF24 Creator, LibreOffice, SumatraPDF, 7-Zip, Everything。
4. **开发环境与终端 (5 款)**：
   - 核心精选：Visual Studio Code (去重合并), Python, Node.js, Notepad++, DBeaver Community, Git for Windows。
5. **影音与创作套件 (6 款)**：
   - 核心精选：OBS Studio, HandBrake, Audacity, GIMP, Krita, PotPlayer。
6. **开源独立游戏 (2 款)**：
   - 核心精选：OpenRA (红色警戒/泰伯利亚开源重制版), Mindustry。

---

## 三、生产服务器环境与安全水位

- **服务器公网 IP**：`134.175.230.107`
- **正式站点**：`https://softtribe.top/`
- **磁盘容量**：总计 68GB，已用 59GB，剩余可用 **9.5GB (使用率 86%)**。
- **Node.js 运行时**：v20.x，PM2 守护模式（`softtribe-backend`，PID 2710724，Cluster 模式在线）。
- **PostgreSQL 容器**：`vasto-postgres`，自动化每日 Crontab 备份正常运行，备份归档目录 `/home/ubuntu/backups/softtribe/`。
- **公网安全收敛**：8080 端口严格限制在 `127.0.0.1:8080`，外部仅放行 80 / 443 / SSH 安全端口。

---

## 四、基线核验结论

1. 数据库中的 62 款草稿为真实建档资源，非机器无序抓取的垃圾数据，具备极高审核发布价值。
2. 35 条异常下载来源已锁定精确主键 ID 与 URL，成因清晰。
3. 本轮未获得生产写入许可前，**严禁将测试数据或未经逐条审核的草稿直接推向生产环境**。
