# 软游部落 P8.9 全站工程架构与运行环境基线报告

## 一、项目身份与工程概况

- **项目名称**：软游部落（SoftTribe）
- **正式公网域名**：`https://softtribe.top/`
- **生产服务器 IP**：`134.175.230.107` (腾讯云 Ubuntu 22.04 LTS)
- **生产备用/直连调试端口**：`http://134.175.230.107:8080/`
- **本地代码工程**：`E:\Code\新建文件夹`
- **远程 Git 仓库**：`https://github.com/zhjlin11/softbuluo.git`
- **当前 Git 分支**：`main`
- **最新发布 Commit**：`b308795` (已完全同步至 `origin/main`)
- **Node.js 运行时**：本地 `v24.14.0` / 生产服务器 `v22.22.1`
- **包管理工具**：npm `11.9.0`
- **生产进程守护**：PM2 v5 (`softtribe-backend`, ID: 11, Cluster Mode)
- **反向代理与 Web 服务器**：Nginx `1.18.0` (Ubuntu)
- **SSL/TLS 证书**：Let's Encrypt RSA 4096，有效期至 `2027-02-08 02:10:50 UTC` (剩余 88 天有效)

---

## 二、前后端技术栈架构

| 层次 | 核心技术 | 版本 | 核心职责 |
| :--- | :--- | :--- | :--- |
| **前端框架** | React | 19.0.1 | 现代化并发模式，无闪烁渲染 |
| **构建工具** | Vite | 8.3.6 | 客户端 SPA 生产构建、ESM 开发热更新 |
| **语言规范** | TypeScript | 7.0.2 / 5.x | 全栈强类型契约，0 编译错误 |
| **样式方案** | Tailwind CSS | v4.3.3 | 原子化样式系统，支持深色模式 |
| **路由系统** | React Router | 7.18.5 | 客户端 SPA 路由管理与历史回退保护 |
| **后端框架** | Fastify | 5.12.8 | 高性能微服务引擎，SSR 预渲染服务 |
| **数据库** | PostgreSQL | 14+ | 强 ACID 关系型业务数据存储 |
| **ORM 映射** | Prisma | 6.19.3 | 数据表映射、Migration 与类型安全操作 |
| **自动化测试** | Tsx + Node Test + Playwright | 1.65.0 | 26 套全阶段质量回归与浏览器实测 |

---

## 三、敏感凭证脱敏与安全隔离清单

依照安全规范，所有涉及生产安全、支付与用户隐私的敏感变量已实施物理隔离与日志脱敏：

| 环境变量名称 | 所在配置文件 | 脱敏展示格式 | 生产注入方式 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `.env` | `postgresql://softbuluo:****@127.0.0.1:5432/softbuluo` | 仅本地与生产独立配置 |
| `SESSION_SECRET` | `.env` | `32+ 字符高熵随机字符串 (已脱敏)` | Fastify Session 密钥 |
| `ADMIN_INIT_TOKEN` | `.env` | `****-SECURE-ADMIN-INIT-****` | 仅初始化初始超管使用 |
| `CLIENT_URL` | `.env` | `https://softtribe.top` | 用于 CORS 跨域白名单与 Canonical |
| `SSH_KEY` | `~/.ssh/id_antigravity` | RSA 4096-bit 私钥文件（只读权限） | 部署脚本与状态审计管道 |

---

## 四、生产服务器资源与运行健康状况

于 2026-11-12 01:00 UTC 实测服务器底层数据：

1. **系统负载 (Load Average)**：`0.60, 0.45, 0.32`（单核/多核负载良好，无突发计算瓶颈）。
2. **系统正常运行时长 (Uptime)**：`up 68 days, 2:00`（系统底层连续稳定运行超 68 天）。
3. **物理内存分配**：
   - 总内存：`3.6 GiB`
   - 已使用：`1.5 GiB`
   - 空闲缓存：`1.9 GiB`
   - 实际可用：`1.8 GiB` (约 50% 可用裕量)
4. **磁盘空间 (`/dev/vda2`)**：
   - 挂载点：`/`
   - 总容量：`69 GB`
   - 已使用：`58 GB`
   - 剩余空间：`8.0 GB`
   - **使用率：88%**（存在长期磁盘增长预警，详见问题清单与运维准备）。
5. **PM2 `softtribe-backend` 实例状态**：
   - Process ID: 11
   - Mode: cluster_mode
   - Uptime: 70m+（P8.7.8 部署后平稳运行）
   - Restarts: 4548（历史部署累计，P8.7.8 重载后 unstable restarts 为 0）
   - Used Heap: `8.74 MiB` (Heap Size: 9.85 MiB)
   - Event Loop Latency: `0.24 ms` (P95: 1.16 ms，毫秒级即时响应)
   - 错误日志文件大小：`0 bytes` (无未捕获异常)

---

## 五、备份与恢复基线状态

1. **网站代码备份**：
   - `/var/www/backups/softtribe_pre_p878_backup.tar.gz` (16.5 MB, 2026-11-11 23:55)
   - `/var/www/backups/softtribe_pre_p8710_backup.tar.gz` (193 MB, 2026-11-11 21:00)
   - `/var/www/backups/softtribe_pre_p879_backup.tar.gz` (193 MB, 2026-11-11 10:35)
2. **数据库备份与归档**：
   - `/home/ubuntu/backups/softbuluo_pre_p8741_20261110_165917.dump` (255 KB)
   - `/home/ubuntu/backups/softbuluo_pre_p874_20261110_155215.dump` (255 KB)
3. **审计基线结论**：
   - 代码目录存在阶段性 tar.gz 备份。
   - 历史 PostgreSQL 具备手动 dump 文件，但**尚未配置每日定时自动备份 Cron 作业**，且**尚未实施异地备份冷存储**。
   - 依据安全审计准则，标记为：`备份存在，恢复能力未在独立沙箱验证 (NOT_VERIFIED)`。

---

## 六、网络路径与 Fake-IP 诊断分析

针对本地 Windows 测试环境偶发 `ERR_CONNECTION_CLOSED` 的专项诊断证据：
1. **DNS 解析结果**：
   - 本地 `Resolve-DnsName softtribe.top` 返回 `198.18.1.101` (TTL=1s)。
2. **根因定位**：
   - `198.18.0.0/15` 网段属于 Clash / Mihomo TUN 模式所分配的保留 **Fake-IP** 地址池。
   - 当本地开发机开启 TUN 模式且未将 `softtribe.top` 设为 DIRECT 直连时，所有出站请求被透明代理中继；若代理节点对国内服务器 TLS SNI 产生阻断或重置，即引发 `ERR_CONNECTION_CLOSED`。
3. **生产实测对比**：
   - 在生产服务器本地执行 `curl -I -k https://softtribe.top` 返回标准 `HTTP/2 200`。
   - 直连服务器真实公网 IP `134.175.230.107:8080` 访问完全正常。
   - 证明线上 Nginx 与证书配置健康，客户端网络代理只需配置直连白名单即可完全规避。
