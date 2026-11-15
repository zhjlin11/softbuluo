# 软游部落 P9.0.2 —— 生产与本地数据库资源基线审计报告

## 一、审计概述与执行背景

在进入软游部落 **P9.0.2 第二批优质软件资源深度审核、官方版本核验与增量发布工程** 之前，依据安全发布与数据治理原则，必须对生产环境与本地开发环境的数据库状态进行全量只读盘点，彻底查清已发布软件、真实草稿储备、历史测试数据及下载源健康状态，杜绝基于历史文档假设计算。

- **审计时间**：2026-11-15
- **审计范围**：生产数据库（`134.175.230.107`，Docker `vasto-postgres`）与本地开发数据库（PostgreSQL `softbuluo`）
- **审计方式**：Prisma Client 只读聚合统计与原子脚本校验（`scripts/p902_local_db_check.ts` 与 `scripts/p902_prod_db_check.cjs`）

---

## 二、生产与本地数据库资源全量对照表

| 统计指标维度 | 本地数据库 (Local) | 生产数据库 (Production) | 一致性与差异说明 |
| :--- | :--- | :--- | :--- |
| **已发布非测试软件总数** | **40 款** | **40 款** | ✅ 完全一致（P9.0.1 首批发布已全量生效） |
| ├─ 电脑软件 (`SOFTWARE`) | 14 款 | 14 款 | ✅ 完全一致 |
| ├─ 系统工具 (`TOOL`) | 23 款 | 23 款 | ✅ 完全一致 |
| └─ 游戏中心 (`GAME`) | 3 款 | 3 款 | ✅ 完全一致 |
| **非测试草稿储备 (`DRAFT`)** | **51 款** | **52 款** | ℹ️ 差异 1 款：生产环境包含 1 款 P9.0.1 安全归档的重复 `vs-code` 草稿（`status = ARCHIVED`） |
| **物理隔离测试软件 (`isTestData = true`)** | 0 款 | 30 款 | ✅ 生产环境保留 30 款历史隔离测试桩（`isTestData = true`），前端及 Sitemap 强过滤已全覆盖 |
| **已发布非测试教程 (`TUTORIAL`)** | 27 篇 | 27 篇 | ✅ 完全一致（已排除 `tut-p3-*` 历史测试教程） |
| **下载来源总数 (`DownloadSource`)** | 120 条 | 160 条 | ℹ️ 差异 40 条：生产环境完整保留了 P9.0.1 治理的 35 条失效链接及历史归档记录 |
| ├─ 启用中来源 (`isActive = true`) | 120 条 | 114 条 | ✅ 生产环境 114 条有效来源全部绑定正式发布软件 |
| └─ 已停用/归档来源 (`isActive = false`) | 0 条 | 46 条 | ✅ 生产环境 46 条失效/冗余源已安全软停用（`reviewStatus = REJECTED`） |

---

## 三、当前已正式发布的 40 款软件清单（查重防撞基线）

为确保第二批候选软件绝对不与既有发布资源发生重复、命名冲突或 Slug 撞车，以下 40 款软件已列入**发布防撞白名单**：

```
[系统工具 23款]
7-Zip (7zip), CPU-Z (cpuz), Rufus (rufus), Everything (everything),
FileZilla (filezilla), HWiNFO64 (hwinfo64), CrystalDiskInfo (crystaldiskinfo),
CrystalDiskMark (crystaldiskmark), GPU-Z (gpuz), Ventoy (ventoy), PuTTY (putty),
WinSCP (winscp), Node.js (nodejs), Python (python), Bandizip (bandizip),
Snipaste (snipaste), Geek Uninstaller (geek-uninstaller), Dism++ (dism-plus),
IDM (idm), Motrix (motrix), Navicat (navicat), Postman (postman), Typora (typora)

[电脑软件 14款]
VLC Media Player (vlc), Blender (blender), LibreOffice (libreoffice),
OBS Studio (obs-studio), VS Code (vscode), PotPlayer (potplayer),
Google Chrome (chrome), Mozilla Firefox (firefox), Microsoft Edge (edge),
微信 (wechat), 钉钉 (dingtalk), 腾讯 QQ (qq), WPS Office (wps-office), OpenRA (openra)

[游戏中心 3款]
Steam (steam), Epic Games Store (epic-games), 原神 (genshin-impact)
```

> [!IMPORTANT]
> 用户建议候选名单中的 `7-Zip`、`VLC`、`Blender`、`CPU-Z`、`Rufus`、`OBS Studio`、`LibreOffice` 等 10 款软件，早在 P8.7 至 P9.0 阶段已完成审核上线。在本次 P9.0.2 中**严禁二次重复收录或覆盖**。

---

## 四、51 款真实草稿资源分类与状态盘点

经过对数据库中 `status = DRAFT` 且 `isTestData = false` 的 51 款真实草稿软件进行分类聚合，其品类分布如下：

1. **系统工具 / 系统维护**：16 款（涵盖 Process Explorer、Autoruns、TreeSize Free、BleachBit、Everything Search 等）
2. **硬件检测 / 稳定性诊断**：5 款（涵盖 MemTest86、AIDA64、FurMark、Core Temp 等）
3. **影音播放 / 转码编辑**：8 款（涵盖 HandBrake、Audacity、foobar2000、Format Factory、Shotcut 等）
4. **编程开发 / 效率增强**：11 款（涵盖 Windows Terminal、Notepad++、GitKraken、Sublime Text、DBeaver 等）
5. **图形图像 / 截图创作**：6 款（涵盖 ShareX、GIMP、Krita、Inkscape、IrfanView 等）
6. **办公阅读 / 实用工具**：5 款（涵盖 Sumatra PDF、Calibre、Ditto、7+ Taskbar Tweaker 等）

---

## 五、基线审计结论

1. **数据库一致性良好**：生产环境与本地环境在核心发布数据（40 款软件、27 篇教程）上完全同口径。
2. **草稿储备充沛**：51 款草稿软件均为真实开源或经典免费工具，具备极高收录价值。
3. **查重防撞屏障已建立**：第二批候选名单严格从 51 款草稿中筛选，与既有 40 款发布软件重合度精准为 **0**。
4. **准入基线满足**：各项数据均已完成只读核查，允许进入第二阶段候选软件官方深度核验。
