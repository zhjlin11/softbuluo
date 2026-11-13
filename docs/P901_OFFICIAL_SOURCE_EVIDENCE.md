# 软游部落 P9.0.1 —— 首批 10 款发布软件官方来源与合规证据链报告

**文档编号**：ST-P901-EVD-01  
**核验完成时间**：2026-11-14 00:10 (CST)  
**当前状态**：`P901_LOCAL_PASSED` / `P901_APPROVAL_REQUIRED`  
**核验标准**：严格区分 Level 4 官方主域与 Level 5 本地二进制 SHA-256，不伪造安全证明。

---

## 一、下载来源可信级别语义规范

为杜绝行业内常见的“将官方直达链接夸大为文件已杀毒脱敏”的虚假宣传，软游部落严格执行六级来源语义：
- **Level 1**：仅登记外部下载 URL（无任何校验）；
- **Level 2**：网络可达性与 HTTP 200/302 检测通过；
- **Level 3**：人工审核软件身份与功能完整度；
- **Level 4（当前首批达成）**：**原厂官网 / GitHub 官方发布仓库认证，防劫持与防仿冒认证**；
- **Level 5**：本地服务器真实下载完整安装包并校验原厂公布的 SHA-256 校验和；
- **Level 6**：Windows Authenticode 数字签名与权威证书有效性实测。

> **重要声明**：本批 10 款软件均已达成 **Level 4 官方权威来源核验**。前台明确标注“原厂直达”与“官方镜像”，绝不向用户谎称已完成本地二进制杀毒脱毒（Level 5/6），诚实披露证据链。

---

## 二、首批 10 款软件官方证据链明细台账

### 1. CrystalDiskInfo (硬盘健康状态检测工具)
- **官方主域**：`https://crystalmark.info/`
- **开源仓库**：`https://github.com/hiyohiyo/CrystalDiskInfo`
- **许可证**：MIT License
- **官方下载入口**：`https://crystalmark.info/en/software/crystaldiskinfo/`
- **架构支持**：Windows x64 / x86
- **版本规范**：9.4.4
- **官方说明**：国际知名硬盘 SMART 状态检测利器，支持 SSD/HDD 健康状况与温度实时监控。

### 2. CrystalDiskMark (硬盘性能基准测试工具)
- **官方主域**：`https://crystalmark.info/`
- **开源仓库**：`https://github.com/hiyohiyo/CrystalDiskMark`
- **许可证**：MIT License
- **官方下载入口**：`https://crystalmark.info/en/software/crystaldiskmark/`
- **架构支持**：Windows x64 / x86
- **版本规范**：8.0.5
- **官方说明**：标准磁盘读写速度基准测试工具，提供连续读写与 4K 随机读写精准测试。

### 3. TechPowerUp GPU-Z (显卡与图形核心规格检测)
- **官方主域**：`https://www.techpowerup.com/`
- **开发者**：TechPowerUp
- **许可证**：免费软件 (Freeware)
- **官方下载入口**：`https://www.techpowerup.com/download/techpowerup-gpu-z/`
- **架构支持**：Windows x64 / x86
- **版本规范**：2.60.0
- **官方说明**：权威轻量级显卡识别工具，详细呈现 GPU 核心频率、显存规格、BIOS 与传感器温度。

### 4. Ventoy (新一代多合一系统启动U盘制作神器)
- **官方主域**：`https://www.ventoy.net/`
- **开源仓库**：`https://github.com/ventoy/Ventoy`
- **许可证**：GPL-3.0
- **官方下载入口**：`https://github.com/ventoy/Ventoy/releases`
- **架构支持**：Windows / Linux 跨平台
- **版本规范**：1.0.99
- **官方说明**：革命性启动制作工具，无需反复格式化 U 盘，仅需将 ISO 文件拷贝至 U 盘即可引导启动。

### 5. PuTTY (免费开源 SSH 与 Telnet 客户端)
- **官方主域**：`https://www.chiark.greenend.org.uk/~sgtatham/putty/`
- **开发者**：Simon Tatham
- **许可证**：MIT License
- **官方下载入口**：`https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html`
- **架构支持**：Windows x64 / ARM64
- **版本规范**：0.81
- **官方说明**：Windows 平台经典轻量终端仿真程序，支持 SSH、Telnet 与串口直连。

### 6. WinSCP (安全 SFTP 与 FTP 文件传输工具)
- **官方主域**：`https://winscp.net/`
- **开发者**：Martin Přikryl
- **许可证**：GPL-3.0
- **官方下载入口**：`https://winscp.net/eng/download.php`
- **架构支持**：Windows x64 / x86
- **版本规范**：6.3.5
- **官方说明**：强大的图形化 SFTP/FTP/SCP 客户端，支持多标签连接、脚本批处理与目录实时同步。

### 7. Node.js (基于 V8 引擎的高性能 JavaScript 运行时)
- **官方主域**：`https://nodejs.org/`
- **开发组织**：OpenJS Foundation
- **许可证**：MIT License
- **官方下载入口**：`https://nodejs.org/en/download/`
- **架构支持**：Windows x64 / ARM64
- **版本规范**：20.18.1 (LTS 长期维护版)
- **官方说明**：全栈开发必备运行时，内置 npm 包管理器与异步事件驱动架构。

### 8. Python 3 (现代面向对象与数据科学编程语言)
- **官方主域**：`https://www.python.org/`
- **开发组织**：Python Software Foundation
- **许可证**：PSF License
- **官方下载入口**：`https://www.python.org/downloads/windows/`
- **架构支持**：Windows x64 (Windows 10/11)
- **版本规范**：3.12.7
- **官方说明**：易读高效的通用编程语言，覆盖 AI 人工智能、数据科学、自动化与后端开发。

### 9. PotPlayer (全能硬件解码影音播放器)
- **官方主域**：`https://potplayer.daum.net/`
- **开发组织**：Kakao Corporation
- **许可证**：免费软件 (Freeware)
- **官方下载入口**：`https://potplayer.daum.net/`
- **架构支持**：Windows x64
- **版本规范**：240924
- **官方说明**：搭载极速硬件加速引擎的全格式播放器，画质细腻、资源占用极低、支持丰富滤镜插件。

### 10. OpenRA (经典即时战略游戏现代化开源重制引擎)
- **官方主域**：`https://www.openra.net/`
- **开发组织**：OpenRA Developers
- **开源仓库**：`https://github.com/OpenRA/OpenRA`
- **许可证**：GPL-3.0
- **官方下载入口**：`https://www.openra.net/download/`
- **架构支持**：Windows x64 / Linux / macOS
- **版本规范**：release-20231010
- **官方说明**：支持红色警戒 (Red Alert)、泰伯利亚之日与沙丘 2000 的现代开源引擎，原生支持高分屏与联网对战。
