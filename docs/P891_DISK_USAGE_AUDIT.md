# 软游部落 P8.9.1 —— 生产磁盘 88% 水位根因排查与空间治理方案

**文档编号**：ST-P891-DISK-03  
**审计时间**：2026-11-12 14:35:00 (CST)  
**主机分区**：`/dev/vda2` (ext4 69GB)  
**当前状态**：已用 58GB (88%)，可用 8.1GB（P8.9 已释放 185MB 冗余包）

---

## 一、真实磁盘物理空间深度解剖

通过对生产宿主机根分区进行无死角层级扫描，全盘 58GB 占用的真实物理分布如下：

```text
/ (总占用 58GB)
├── /var/        (23.0 GB)  ── 核心 Web 站点与应用运行时
├── /home/       (18.0 GB)  ── 用户目录与历史构建包
├── /usr/        (7.6 GB)   ── 系统核心二进制库与 Node/Python 环境
├── /tmp/        (2.7 GB)   ── 历史临时上传与 Chrome 无头浏览器缓存
├── /opt/        (2.4 GB)   ── Jetten 后端独立服务
└── /etc/, /root (约 200MB) ── 系统配置与根目录
```

### 1. `/var` 目录细分（23 GB）
- `/var/www/iyanglin.com`：**12.0 GB**（多租户主机上并行的另行独立业务站点）
- `/var/www/softtribe.top`：**614 MB**（软游部落全部前端 dist 产物与后端代码）
- `/var/www/jetten.cn`：**561 MB**
- `/var/www/backups`：**432 MB**（软游部落历史代码全量快照归档）
- `/var/www/ai.jetten.cn`：**344 MB**
- `/var/www/ilobst.com`：**254 MB**
- `/var/log`：**1.2 GB**（其中 journal 521MB，nginx 226MB，syslog 380MB）

### 2. `/home/ubuntu` 目录细分（18 GB）
- 10 个历史残留构建包（`iyanglin-build-*`）：**约 8.5 GB**
- `/home/ubuntu/defense_backup`：**1.1 GB**
- `/home/ubuntu/backups/softtribe`：**512 KB**（软游部落当前纯净 dump 备份，体积轻量健康）

### 3. `/tmp` 目录细分（2.7 GB）
- `iyanglin-src.tar.gz`：**613 MB**（已停止构建的遗留压缩包）
- Chrome Headless 临时目录：**约 834 MB**（`scoped_dir.*`）
- `dist_upload.tar.gz`：**403 MB**（历史前台构建包遗留）
- `meta-all.log` / `jall.log`：**306 MB**

---

## 二、严格禁止盲目删除的安全操作红线

在多项目共用云服务器的现实背景下，必须严守如下安全边界：

> [!CAUTION]
> 1. **严禁执行通配删除**：绝不能直接运行 `rm -rf /var/www/backups/*` 或 `rm -rf /tmp/*`，防止误删系统套接字或正在运行的 PID 文件。
> 2. **严禁跨项目破坏**：`/var/www/iyanglin.com` 及 `/home/ubuntu/iyanglin-build-*` 属于服务器上其他独立运行系统的资产，软游部落运维组**严禁在无明确跨系统授权的前提下擅自触碰**。
> 3. **严禁破坏 Docker 挂载**：绝对禁止直接修改或删除 `/var/lib/docker/volumes` 中的 PostgreSQL 容器存储。
> 4. **严禁清空活跃日志**：禁止删除正在被进程写入的 `access.log` 或 `error.log`（会导致 inode 悬空而不释放磁盘，应使用 `truncate -s 0` 或 logrotate）。

---

## 三、可安全清理的候选对象与潜在收益

经安全研判，属于软游部落及确认可回收的临时资产如下：

| 清理候选目标 | 归属类型 | 当前体积 | 清理安全性 | 预期风险 |
| :--- | :--- | :---: | :---: | :--- |
| `/var/www/backups/softtribe_pre_p879_.tar.gz` | 重复备份包 | 185 MB | **已完成** | 零风险（已确认存在完全一致的备份包） |
| `/tmp/dist_upload.tar.gz` | 历史上传残留 | 403 MB | **高安全** | 零风险（部署解压后未清理的中间包） |
| `/tmp/com.google.Chrome.scoped_dir.*` | 浏览器孤儿缓存 | 834 MB | **高安全** | 零风险（Playwright 进程退出后未释放的临时缓存） |
| `/var/www/backups/softtribe_pre_p879_backup.tar.gz` | 包含 node_modules 的旧包 | 185 MB | **中安全** | 需保留 `softtribe_pre_p89_backup.tar.gz` (32MB) 替代 |

**潜在可释放空间合计**：约 **1.4 GB**，可将可用磁盘空间从 8.1GB 提升至 **9.5GB** 以上。

---

## 四、磁盘容量预警与自动化监控脚本

为了杜绝磁盘在运营期被悄然写满，已设计磁盘水位巡检告警逻辑（脚本内置阈值）：

```bash
#!/bin/bash
# /home/ubuntu/scripts/check_disk_alert.sh
USAGE=$(df / | tail -n 1 | awk '{print $5}' | tr -d '%')
if [ "$USAGE" -ge 90 ]; then
    echo "[CRITICAL ALERT] 生产根磁盘使用率已达 ${USAGE}% (超过 90% 临界水位)！" >&2
    # 输出体积最大的前 5 个目录辅助排查
    du -sh /var/log /tmp /var/www/backups 2>/dev/null
    exit 2
elif [ "$USAGE" -ge 85 ]; then
    echo "[WARNING] 生产根磁盘使用率为 ${USAGE}% (已达 85% 预警水位)。"
fi
```
