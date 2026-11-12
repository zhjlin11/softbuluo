# 软游部落 P8.9.1 —— 生产变更前强制安全预检与基线审计报告

**报告编号**：ST-P891-BASE-01  
**审计时间**：2026-11-12 14:30:00 (CST)  
**执行角色**：软游部落首席系统架构师 / Linux 高级运维工程师 / PostgreSQL DBA  
**审计对象**：本地工程 (`E:\Code\新建文件夹`) & 生产服务器 (`ubuntu@134.175.230.107`)  
**阶段状态**：`Stage A: 只读诊断与本地准备完成 (READONLY_AUDIT_PASSED)`

---

## 一、代码仓库与版本基线

| 维度 | 本地工程基线 | 生产环境基线 | 状态说明 |
| :--- | :--- | :--- | :--- |
| **Git 分支** | `main` | 无 `.git`（生产解压部署目录） | 正常规范（生产运行纯构建与运行时代码） |
| **最新 Commit** | `63d0009` | 同步对应 `fa1ac13` + 运维脚本 | 本地新增 P8.9.1 测试套件与巡检脚本 |
| **工作区状态** | Clean (未提交变更仅限新增审计脚本) | `/var/www/softtribe.top` 归属 `ubuntu:ubuntu` | 权限一致，无未授权直接篡改 |
| **远程仓库** | `github.com/zhjlin11/softbuluo.git` | `origin/main` 保持最新同步 | 零脱节 |

---

## 二、生产服务器健康与系统运行状态

```text
=== 生产主机系统信息 (实测数据) ===
OS: Ubuntu 22.04.5 LTS (Kernel: 5.15.0-171-generic x86_64)
主机名: VM-20-11-ubuntu
系统运行时间: up 68 days, 15:18 (无非预期崩溃重启)
平均负载: 0.48, 0.35, 0.27 (系统处于健康低负载水准)
内存使用: 总计 3.8GB, 剩余 1.8GB, Cache 1.6GB
根分区容量 (/dev/vda2): 总计 69GB, 已用 58GB, 可用 8.1GB, 占用率 88%
```

### PM2 进程状态
- **应用名称**：`softtribe-backend`（ID: 11）
- **运行模式**：`cluster_mode`
- **当前 PID**：2558307
- **Uptime**：35m（于前次版本发布执行平滑 reload 后持续稳定）
- **重启历史**：4550 次（历史累计，当前实例 unstable restarts = 0）
- **内存占用**：8.68 MiB (90.41% Heap Usage)
- **事件循环延迟 (p95)**：1.16 ms（高响应度）
- **错误日志**：`/home/ubuntu/.pm2/logs/softtribe-backend-error-11.log` (0 错误输出)

---

## 三、网络监听与端口映射现状

| 监听地址 | 端口 | 监听进程 | 说明与安全状态 |
| :--- | :--- | :--- | :--- |
| `0.0.0.0` / `[::]` | `80` | `nginx` (pid: 2544150) | HTTP 生产入口（重定向至 HTTPS） |
| `0.0.0.0` / `[::]` | `443` | `nginx` (pid: 2544150) | HTTPS 核心安全入口（TLS 1.2/1.3，证书 87 天有效） |
| `0.0.0.0` | `8080` | `nginx` (pid: 2544150) | **高危公网调试端口**（详见专题分析） |
| `127.0.0.1` | `3008` | `node / tsx` (softtribe) | Fastify 真实后端端口（回环地址绑定，安全） |
| `0.0.0.0` / `[::]` | `5432` | `docker-proxy` | Docker 映射到 `vasto-postgres`（受防火墙与密码保护） |
| `0.0.0.0` / `[::]` | `22` | `sshd` | SSH 运维通道（Key 鉴权 + fail2ban-sshd） |

---

## 四、PostgreSQL 数据库规模与真实数据核验

PostgreSQL 15.17 运行于 Docker 容器 `vasto-postgres` 中，数据库名 `softbuluo`：
- **数据库磁盘物理体积**：12 MB
- **数据表总数**：56 张（`public` schema）
- **软件总记录**：123 款（已发布且有效公开为 30 款）
- **下载来源记录**：160 条（绑定各版本）
- **教程总记录**：44 篇（包含 17 篇历史自动化测试数据 `tut-p3-*`）
- **真实公开实操教程**：**27 篇**（已在后端 API 与 Sitemap 中物理隔离排除测试数据）

---

## 五、已存在备份资产与完整性测试

### 1. 数据库物理逻辑备份清单（`/home/ubuntu/backups/softtribe/`）
- `softbuluo_20261112_135819.dump`（254 KB，Custom 压缩格式，TOC Entries 388，校验通过）
- `softbuluo_pre_p89_backup.dump`（254 KB，发布前基线备份）

### 2. 代码与静态资源归档（`/var/www/backups/`）
- `softtribe_pre_p89_backup.tar.gz`（32 MB，排除庞大 node_modules 的精简基线）
- `softtribe_pre_p8710_backup.tar.gz`（185 MB）
- `softtribe_pre_p879_backup.tar.gz`（185 MB）

---

## 六、待实施生产变更与风险评估清单

| 编号 | 变更事项 | 操作对象 | 风险等级 | 是否需停机 | 授权要求 |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **CHG-01** | PostgreSQL 备份脚本增加 SHA-256 校验与容量保护 | `/home/ubuntu/scripts/backup_db_daily.sh` | **低** | 否 | 需用户确认 |
| **CHG-02** | 生产磁盘 `/tmp` 无用构建残留清理 | `/tmp/` 下临时 `.tar.gz` 与 `.zip` | **中** | 否 | 需用户确认 |
| **CHG-03** | 8080 端口收敛（Nginx 改为监听 127.0.0.1:8080） | `/etc/nginx/sites-available/softtribe.top.conf` | **高** | 平滑重载 | **强制需授权** |
| **CHG-04** | UFW 防火墙移除 `8080/tcp` 公网放行规则 | `ufw delete allow 8080/tcp` | **高** | 否 | **强制需授权** |
| **CHG-05** | 下载来源坏链与 404 标记治理 | 数据库 `DownloadSource` 状态更新 | **中** | 否 | 需用户确认 |

> [!IMPORTANT]
> **预检结论**：当前生产系统整体稳定，但存在 8080 端口公网暴露、磁盘空间 88% 水位及下载源有效率待治理等风险。所有变更已在本地和隔离环境中通过验证，在获得用户明确授权前，严格停留在 Stage A。
