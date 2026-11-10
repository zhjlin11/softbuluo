# 软游部落 P8.7.3 —— 系统工具频道 (`/system-tools`) 升级前基线审计报告

- **审计日期**：2026-11-10
- **目标路由**：`/system-tools`（正式目标地址：`https://softtribe.top/system-tools`）
- **现有页面组件**：`src/pages/SystemToolsPage.tsx`（386 行单文件组件）

---

## 一、现网与本地前端基线状态

| 检查项 | 改版前实际状态 | 发现的问题与差距 |
| :--- | :--- | :--- |
| **路由与独立 H1** | 路由 `/system-tools` 已配置；`<h1>系统工具与电脑维护中心</h1>` 存在 | 缺乏全站统一门户信息架构，面目单一，仅为卡片列表页 |
| **SEO / Canonical / SSR** | CSR 使用 `document.title`；`<link rel="canonical">` 仍指向 `https://softbuluo.com/`（未独立指向 `/system-tools`） | 缺少动态 JSON-LD、OpenGraph、后端 SSR `/system-tools` 路由、`/robots.txt` 放行条目及 Sitemap 收录 |
| **真实数据拉取** | 调用 `/api/v1/resources?type=TOOL&limit=60`，回退调用 `categorySlug=system-tools` | 数据库真实分类 Slug 为 `sys-tools`（而非 `system-tools`），回退请求恒返回 **0 条**；页面实际仅展示 15 款 `type=TOOL` 软件 |
| **来源真实性与高风险提示** | 底部所有 15 张工具卡统一硬编码绿色 **「人工校验」** 徽章，且缺少版本兜底误显示 `v1.0.0` | **失实缺陷**：无论来源是否 `APPROVED && HEALTHY`、是否有 `SHA-256`，一律标绿显示“人工校验”；顶部宣传“全部工具经严格人工沙盒验证，原厂哈希校验”缺乏来源真实性对应 |
| **分类筛选逻辑** | 6 个前端写死场景 + 7 个前端写死 `TOOL_CATEGORIES` 子标签 | `activeSubcat === 'system_repair'` 回退 `return true`（展示全部工具未真正筛选）；缺少操作系统/授权协议/排序/分页筛选 |
| **门户结构深度** | 无专题 Hero 大图轮播、无常用工具推荐矩阵、无工具分类分区、无编辑精选、无排行榜、无专题卡、无维修教程区、无版本更新/新收录双栏 | 与 `P8.7.1 / P8.7.2` 升级后的 `/software` 门户化专业感存在代差，且无法按故障场景直达关联教程与专题 |
| **后台运营支持** | 仅支持 `SOFTWARE` 频道运营配置（`ALLOWED_CHANNELS = ['SOFTWARE']`） | 运营后台 `/admin/channel-software` 硬编码 `'SOFTWARE'`，无法独立配置 `SYSTEM_TOOLS` 频道展位 |
| **跨设备渲染截图** | `1440×900` 与 `390×844` 均 0 横向溢出（基线截图已存档） | 已保留 `p873_before_system_tools_1440.png` 与 `p873_before_system_tools_390.png` |

---

## 二、真实数据库资产审计（已发布、非测试、`type !== 'GAME'`）

1. **核心桌面维护工具与系统资源（共 15 款 `type = 'TOOL'`）**：
   - **纯系统维护 / 硬件 / 网络 / 装机实用工具（10 款）**：
     - `sys-tools`：`7zip` (`GNU LGPL`, 3 审核健康源, `24.09`)、`everything` (`Freeware`, 2 审核健康源, `1.4.1.1026`)、`rufus` (`GPL-3.0`, 1 审核健康源, `4.6`)、`diskgenius` (`Freeware/Shareware`, 待审核源, `5.6.1.1580`)、`geek-uninstaller` (`Freeware`, 待审核源, `1.5.2.165`)
     - `hardware`：`cpu-z` (`Freeware`, 待审核源, `2.12`)、`hwinfo` (`Freeware`, 待审核源, `8.16`)
     - `network`：`wireshark` (`GPL-2.0`, 1 审核健康源, `4.4.2`)、`ab-download-manager` (`OPEN_SOURCE`, 待审核源, `v1.5.4`)
     - `dev`：`git` (`GPL-2.0`, 1 审核健康源, `2.47.1`)
   - **微软系统发行版 / 安装指引条目（5 款，均属 `sys-tools` & `COMMERCIAL`）**：
     - `windows-11`、`windows-10`、`windows-ltsc`、`windows-server`、`windows-7`（经 P8.7.2 合规整改，已移除第三方网盘直链并补充商业授权说明，其中 `windows-11` 与 `windows-10` 存在旧测试期间遗留 `FAILED` 来源标记，展示时严禁虚标绿色校验）
   - **跨分类补充候选工具**：`filezilla`（`SOFTWARE / network`, `GPL-2.0`）等仅用于极少数专题关联或完整检索，**严格不把 Office 办公软件混入系统维护工具清单**。
2. **可用真实专题（含已发布 `TOOL` 关联）**：
   - `win11-essential-tools`（Windows 11 新电脑装机必备工具指南：含 `7zip`, `everything`, `geek-uninstaller`）
   - `disk-health-diagnosis`（电脑硬盘健康检测与故障排查指南：含 `diskgenius`）
   - `windows-sysinternals-guide`（Windows 系统底层维护与 Sysinternals 神器全解：含 `geek-uninstaller`）
   - `lan-troubleshooting-tools`（局域网与网络故障排查诊断工具箱：含 `wireshark`）
   - `software-clean-uninstallation`（软件深度卸载与系统注册表残留清理：含 `geek-uninstaller`）
   - `genuine-microsoft-installation-media`（Windows 与 Office 安装资源及原版镜像校验指南：含 `windows-11`, `windows-10`, `windows-ltsc`, `windows-server`, `windows-7`, `ab-download-manager`）
3. **可用真实维护教程与对比**：
   - 教程包含 `how-to-verify-genuine-iso-checksums`、`everything-advanced-search-syntax`、`7zip-ultra-compression-parameters`、`geek-uninstaller-clean-remnants`、`rufus-win11-bypass-tpm-guide`、`wireshark-http-tcp-handshake-capture`、`crystaldiskinfo-smart-health-check`、`sysinternals-autoruns-clean-startup`、`bleachbit-windows-deep-clean-privacy`、`ventoy-custom-multiboot-usb`、`clean-install-win11-guide`、`7zip-aes256-encryption-tutorial`。
   - 对比评测：`7zip-vs-peazip`。

---

## 三、P8.7.3 核心设计策略与防虚假原则

1. **真数据诚实呈现**：严格基于真实已发布的 **15 款 `TOOL` 资源（重点突出 10 款维护/排障实操工具，理性区分 5 款系统安装说明）**，**绝不编造虚假工具或拉办公软件凑数**。
2. **明确高风险操作提示与商业授权区分**：对分区、启动盘制作、数据恢复、卸载注册表工具清晰标示高风险警示；遵循 P8.7.2 来源与 `SHA-256` 真实口径，绝不默认亮绿标「人工校验」。
3. **独立体系与频道复用**：后端新增 `SYSTEM_TOOLS` 聚合服务与 `/api/v1/channels/system-tools` 接口，复用并扩展 `ChannelRecommendation`（新增 `'SYSTEM_TOOLS'` 允许频道）和 `/admin/channel-software` 运营界面（新增频道切换选项卡），确保不破坏已有 `SOFTWARE` 配置。
4. **原生视觉资产与性能优化**：新增原创本地矢量科技 Banner 与故障图标资产，0ms 本地加载、零外链盗图风险，完整覆盖 `HERO / 维修常用工具 / 6大电脑故障场景 / 专业工具分类 / 编辑精选 / 真实双榜 / 维修专题 / 维护教程 / 更新与新收录双栏 / 多维完整工具库`。
