# 软游部落 P8.7.6 对比评测频道 UI 3.0 生产环境部署与公网验收报告

- **项目名称**：软游部落（SoftTribe）
- **正式公网域名**：`https://softtribe.top/`
- **正式生产服务器**：`ubuntu@134.175.230.107`（Site Root: `/var/www/softtribe.top`）
- **正式发布时间**：2026-11-10 21:38 (UTC+8)
- **阶段代号**：P8.7.6 对比评测频道 UI 3.0 门户化升级
- **部署状态**：**`PROD_DEPLOYED_AND_VERIFIED`**（生产发布成功，公网全链路实测通过）

---

## 一、发布前备份与安全归档

在任何生产文件覆盖或服务重启前，已在远程服务器生成独立安全快照：

| 备份类型 | 远程服务器备份路径 | 文件大小 | 说明 |
| :--- | :--- | :--- | :--- |
| 代码与静态资源归档 | `/home/ubuntu/backups/softtribe_code_pre_p876_.tar.gz` | `15MB` | 线上 `/var/www/softtribe.top` 源码与 `dist/` 备份 |

---

## 二、生产部署与服务重载执行摘要

1. **洁净归档与原子替换**：
   - 本地构建确认无误后打包 `p876_deploy_payload.tar.gz`（`15.9MB`）；
   - 通过安全 SSH 密钥（`id_antigravity`）上传至生产主机 `/tmp/p876_deploy_payload.tar.gz`；
   - 在生产服务器解压至 `/var/www/softtribe.top/`，更新前端资源包与后端服务代码。
2. **生产数据库对齐与关系治理**：
   - 运行对齐脚本 `server/src/scripts/p876ProductionAlign.ts`；
   - 修复 `vscode-vs-sublime` 评测长文关联软件，将其从草稿 `vs-code` 更新至正式已发布 `vscode`（`cmw7ulqph000cvkmkkzdz9r9o`）；
   - 同步批准 5 组认证开源替代关系（7-Zip → PeaZip、VS Code → Sublime Text、Office 2024 → LibreOffice、HWiNFO64 → CPU-Z、DiskGenius → Rufus）。
3. **PM2 服务平滑重载**：
   - 执行 `pm2 reload softtribe-backend --update-env`；
   - 进程状态正常（`online`），内存开销稳定。

---

## 三、生产公网全链路验收结果

### 1. 核心端点实测数据

| 检验端点 | 目标路径 | 响应状态 | 校验指标 |
| :--- | :--- | :--- | :--- |
| 对比评测频道页面 | `/compare` | **HTTP 200** | 标题「软件横向对比与选型指南」，H1 存在，无白屏 |
| 对比频道聚合 API | `/api/v1/channels/compare` | **HTTP 200** | 返回 2 篇已发布长文、28 款可比软件、5 组认证替代、6 大品类 |
| 动态参数矩阵接口 | `/api/v1/channels/compare/matrix?left=7zip&right=peazip` | **HTTP 200** | 25 项客观参数、15 项差异识别、关联精选长文 |
| 动态参数矩阵接口 | `/api/v1/channels/compare/matrix?left=vscode&right=sublime-text` | **HTTP 200** | 27 项客观参数、16 项差异识别、关联精选长文 |
| 动态 Sitemap XML | `/sitemap-comparisons.xml` | **HTTP 200** | 包含 `/compare` 频道及已发布对比 URL，格式合规 |

### 2. Playwright 真实浏览器线上验收（`prod_p876_compare_*.png`）
- **桌面端 1440px**：
  - 页面标题：`软件横向对比与选型指南 - 深度参数功能评测 - 软游部落`；
  - 核心 H1：`软件横向对比与客观选型指南`；
  - 65%/35% Banner、双向选择下拉框、矩阵差异高亮、场景决策卡片全部正常渲染；
  - 生成截图：`prod_p876_compare_1440.png`。
- **移动端 390px**：
  - 视口尺寸检测：`scrollWidth === 390`，`clientWidth === 390`；
  - **外层横向溢出率为 0**，单列堆叠布局贴合完好；
  - 生成截图：`prod_p876_compare_390.png`。
- **URL 查询参数水合**：
  - 直接访问 `/compare?left=vscode&right=sublime-text` 成功水合左右选择框与参数矩阵。

### 3. 全站既有核心栏目无回退回归
- `/`（首页）：**HTTP 200**
- `/software`（电脑软件）：**HTTP 200**
- `/system-tools`（系统工具）：**HTTP 200**
- `/games`（游戏中心）：**HTTP 200**
- `/essentials`（装机必备）：**HTTP 200**

---

## 四、最终结论

软游部落 P8.7.6 对比评测频道 UI 3.0 门户化升级**已正式发布上线并在公网全面验收通过**。
所有功能平稳运行，零虚假数据注入，全站既有业务无任何回退。
