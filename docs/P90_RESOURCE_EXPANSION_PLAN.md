# 软游部落 P9.0 —— 真实软件资源有序扩充与元数据合规计划

**文档编号**：ST-P90-RES-02  
**发布时间**：2026-11-12 21:15:00 (CST)  
**负责人**：资源合规与内容审核组  
**核心原则**：**拒绝批量抓取低质垃圾，坚持高质量真实软件收录；合规先行、官方直链、版权清晰、去重入库。**

---

## 一、资源现状与扩充策略

当前软游部落前台正式公开 30 款标杆软件（13款电脑软件、15款系统工具、2款开源游戏）。  
在现有数据库储备中，**已预先建档 62 款高质量草稿软件（`status: DRAFT`）**。P9.0 的核心目标不是盲目网络爬虫，而是：
1. **优先激活与精修现有 62 款草稿软件**：核验官网、补充官方最新稳定版、补齐官方直链通道与正版声明；
2. **建立 6 大技术领域的优质候选池**：按照技术人群实操与装机场景，分批有序推进审核；
3. **实行严格的「草稿 → 人工审核 → 来源复核 → 发布」闭环**，严禁未经核验的第三方搬运安装包流入生产。

---

## 二、六大领域首批扩充候选清单（及去重状态）

通过执行综合查重引擎（Levenshtein 距离、规范化域名与 Slug 比对），对候选清单与现有 123 条数据进行交叉比对：

```text
========================================================================
📋 软游部落 P9.0 核心软件资源扩充候选与查重对照表
========================================================================
```

### 1. 系统维护与硬件诊断（System Maintenance）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **CrystalDiskInfo** | `crystalmark.info` | MIT / 免费软件 | **已存在草稿** (`crystaldiskinfo`) | 完善 S.M.A.R.T. 字段，核验最新稳定版 9.5.x，准备审核 |
| **CrystalDiskMark** | `crystalmark.info` | MIT / 免费软件 | **已存在草稿** (`crystaldiskmark`) | 补充 NVMe 固态硬盘测速场景，核验官网直接下载 |
| **CPU-Z** | `cpuid.com` | 免费共享 | **已正式发布** (`cpu-z`) | 已在线，维持日常版本追踪 |
| **GPU-Z** | `techpowerup.com` | 免费共享 | **已存在草稿** (`gpuz`) | 关联显卡核心参数与传感器监控，准备人工审核 |
| **MemTest86** | `memtest86.com` | 专有免费版 (PassMark) | **已存在草稿** (`memtest86`) | 强调 UEFI 引导启动盘制作规范，提供官方原厂 ISO/USB 下载引导 |
| **Ventoy** | `ventoy.net` / GitHub | GPLv3 (开源) | **已存在草稿** (`ventoy`) | 推荐为多系统装机首选启动神器，配置官方 GitHub Release 直链 |
| **balenaEtcher** | `balena.io/etcher` | Apache-2.0 (开源) | **全新候选 (NEW)** | 扩充树莓派与 Linux 镜像烧录场景，建立草稿并核查 Electron 体积 |
| **Process Explorer** | `learn.microsoft.com` | Sysinternals 官方 | **全新候选 (NEW)** | 微软官方高级任务管理器，补充官方 Sysinternals 直链 |
| **Autoruns** | `learn.microsoft.com` | Sysinternals 官方 | **全新候选 (NEW)** | Windows 启动项全方位排查工具，官方原厂无广告 |

### 2. 文件管理与生产力工具（File Management）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **7-Zip** | `7-zip.org` | GNU LGPL | **已正式发布** (`7zip`) | 已在线，需修复历史 ARM64 链接 404 |
| **PeaZip** | `peazip.github.io` | GNU LGPLv3 | **已正式发布** (`peazip`) | 已在线，维持日常版本监测 |
| **Everything** | `voidtools.com` | 免费软件 (Voidtools) | **已正式发布** (`everything`) | 已在线，补充 HTTP 索引与排障指南 |
| **FreeFileSync** | `freefilesync.org` | GPLv3 (开源) | **全新候选 (NEW)** | 文件夹同步与局域网数据比对首选，需声明安装程序无赞助插件 |
| **WinMerge** | `winmerge.org` | GPLv2 (开源) | **全新候选 (NEW)** | 代码与文件差异高亮对比神器，支持文本、表格与文件夹比对 |
| **Bulk Rename Utility** | `bulkrenameutility.co.uk` | 个人免费版 | **全新候选 (NEW)** | Windows 批量重命名天花板工具，官方通道直链 |

### 3. 网络协议与运维诊断（Network Tools）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **Wireshark** | `wireshark.org` | GPLv2 (开源) | **已正式发布** (`wireshark`) | 已在线，配套排障教程已上线 |
| **Nmap** | `nmap.org` | NPSL (开源) | **已存在草稿** (`nmap`) | 补充网络管理员端口扫描合规声明，提供 Zenmap GUI 选项 |
| **PuTTY** | `putty.org` | MIT (开源) | **已存在草稿** (`putty`) | **重点治理防钓鱼**：必须绑定 Simon Tatham 官方源，杜绝汉化劫持 |
| **WinSCP** | `winscp.net` | GPLv3 (开源) | **已存在草稿** (`winscp`) | 经典 SFTP 传输工具，提供官方原版免安装版与安装版双通道 |
| **FileZilla** | `filezilla-project.org`| GPLv2 (开源) | **已正式发布** (`filezilla`) | 已在线，注意区分纯净版与商业绑定版 |
| **Advanced IP Scanner** | `advanced-ip-scanner.com`| 免费软件 | **已存在草稿** (`advanced-ip-scanner`) | 局域网设备拓扑快速巡检，准备人工审核入库 |

### 4. 开发者开发与环境工具（Developer Tools）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **Visual Studio Code** | `code.visualstudio.com`| MIT (源码) / 微软专有 | **已正式发布** (`vscode`) | 清理历史重复 404 来源，绑定官方稳定 Release API |
| **Git for Windows** | `git-scm.com` | GPLv2 (开源) | **已正式发布** (`git`) | 关联装机必备开发场景，维持更新日志抓取 |
| **Python** | `python.org` | PSF License (开源) | **已存在草稿** (`python`) | 区分 Python 3.12/3.13 官方 Windows 安装包与 Embed 绿色版 |
| **Node.js** | `nodejs.org` | MIT (开源) | **已存在草稿** (`nodejs`) | 突出标注 LTS 长期支持版（22.x），提供官方原厂 MSI 直链 |
| **Notepad++** | `notepad-plus-plus.org`| GPLv3 (开源) | **已存在草稿** (`notepad-plus-plus`) | 知名轻量代码编辑器，校验官方 HTTPS 发布页与哈希声明 |
| **DBeaver Community** | `dbeaver.io` / GitHub | Apache-2.0 (开源) | **已存在草稿** (`dbeaver`) | 通用数据库客户端首选，关联跨平台 Java 运行时环境说明 |

### 5. 影音后期与创意设计（Media & Creative）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **VLC Media Player** | `videolan.org` | GPLv2 / LGPLv2.1 | **已正式发布** (`vlc`) | 全能解码播放器，官方 CDN 通道健康 |
| **OBS Studio** | `obsproject.com` | GPLv2 (开源) | **已正式发布** (`obs-studio`) | 行业标准直播录屏工具，配置官方 Windows x64 安装包 |
| **HandBrake** | `handbrake.fr` | GPLv2 (开源) | **已存在草稿** (`handbrake`) | 视频压制转换神器，强调开源免费与 AV1/HEVC 硬件加速支持 |
| **Audacity** | `audacityteam.org` | GPLv3 (开源) | **已存在草稿** (`audacity`) | 多轨音频录制与剪辑，提供官方纯净下载通道 |
| **Blender** | `blender.org` | GPLv3 (开源) | **已正式发布** (`blender`) | 三维建模标杆，人工复核 Cloudflare 防护下的官方页面 |
| **GIMP** | `gimp.org` | GPLv3 (开源) | **已存在草稿** (`gimp`) | 经典开源修图利器，提供 Windows 官方稳定安装引导 |
| **Krita** | `krita.org` | GPLv3 (开源) | **已存在草稿** (`krita`) | 自由开源数字绘画原画神器，提供官网直接下载与免安装版本 |

### 6. 办公协同与安全效率（Office & Productivity）
| 候选软件名称 | 官方域名 / GitHub | 许可证类型 | 数据库查重状态 | 扩充实施策略 |
| :--- | :--- | :---: | :---: | :--- |
| **LibreOffice** | `libreoffice.org` | MPL-2.0 (开源) | **已正式发布** (`libreoffice`) | 官方原厂纯净办公套件，持续提供 Windows 中文版通道 |
| **SumatraPDF** | `sumatrapdfreader.org` | GPLv3 (开源) | **全新候选 (NEW)** | 极致轻量秒开的 PDF 阅读器，支持单文件便携绿色版 |
| **PDF24 Creator** | `tools.pdf24.org` | 免费软件 (Geek Software) | **全新候选 (NEW)** | 全功能离线 PDF 工具箱（合并/拆分/压缩/转文本），100% 免费 |
| **Mozilla Thunderbird** | `thunderbird.net` | MPL-2.0 (开源) | **已存在草稿** (`thunderbird`) | 开源邮件客户端首选，支持端到端 PGP 加密 |
| **Bitwarden** | `bitwarden.com` / GitHub| GPLv3 (客户端开源) | **全新候选 (NEW)** | 跨平台开源密码管理工具，官方直链与云端安全合规认证 |

---

## 三、版权合规红线与法律边界

软游部落作为面向全国用户的正版软件与开源工具门户，严守以下四项法律与道德底线：

1. **绝对禁止提供破解补丁、注册机与盗版镜像**：商业软件（如 Microsoft 365）仅提供官方合规订阅购买指导与官方原厂部署工具（ODT）使用说明，绝不分发商业激活码。
2. **遵守开源软件商标与二次分发规范**：针对具有商标使用约束的开源软件（例如 Firefox、Red Hat 相关衍生品），仅提供指向官方官网的原始发布通道，不擅自对安装包进行篡改或二次加壳。
3. **官方来源防钓鱼机制（Anti-Phishing）**：对于 PuTTY、Everything 等曾被搜索引擎灰产广告恶意仿冒的开源工具，必须严格绑定其原始官方顶级域名，并在前台页面提供明确的「官方原厂认证标识」。
4. **元数据采集禁止侵犯第三方权利**：软件介绍与评测必须坚持原创与官方公开文档翻译整理，严禁爬取第三方商业下载站带有版权声明的长篇文案。
