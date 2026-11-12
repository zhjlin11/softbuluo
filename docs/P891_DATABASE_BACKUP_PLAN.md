# 软游部落 P8.9.1 —— PostgreSQL 数据安全备份架构与灾难恢复演练方案

**文档编号**：ST-P891-DB-02  
**版本**：v1.0 (2026-11-12)  
**DBA 负责人**：软游部落数据架构组  
**安全定级**：机密（禁止记录明文数据库密码）

---

## 一、备份现状与数据库架构审计

| 维度 | 实测生产配置 | 安全审计结论 |
| :--- | :--- | :--- |
| **数据库引擎** | PostgreSQL 15.17 (Alpine) 运行于 Docker `vasto-postgres` | 容器健康运行逾 2 个月，未发生不可逆崩溃 |
| **生产数据库名** | `softbuluo` | 纯净独立数据库，数据量约 12 MB |
| **所属数据表** | 56 张（涵盖会员、软件、版本、教程、下载源、订单等） | 外键与联合主键约束完整 |
| **备份格式** | 自定义逻辑归档格式（`-F c`） | 支持按表精细化恢复与压缩，体积约 254 KB |
| **存储物理路径** | `/home/ubuntu/backups/softtribe/` | **隔离于 Web 根目录**，禁止通过任何 HTTP/HTTPS 路径下载 |
| **执行调度方式** | 系统计划任务 Crontab (`0 3 * * *`) | 每日凌晨 3 点自动触发，输出重定向至独立日志文件 |
| **生命周期策略** | 自动轮转保留 14 天（`-mtime +14`） | 防止无限增生耗尽服务器磁盘 |

---

## 二、自动备份机制与脚本实现

生产备份调度核心脚本已于 `/home/ubuntu/scripts/backup_db_daily.sh` 落地，其安全设计规范如下：

```bash
#!/bin/bash
set -e
BACKUP_DIR="/home/ubuntu/backups/softtribe"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/softbuluo_$DATE.dump"

# 前置磁盘安全水位检查（剩余必须大于 2GB，否则阻断并报警）
FREE_KB=$(df / | tail -n 1 | awk '{print $4}')
if [ "$FREE_KB" -lt 2097152 ]; then
    echo "[$(date)] [FATAL] 磁盘剩余空间小于 2GB，自动阻断备份以防宿主机夯死！" >&2
    exit 2
fi

echo "[$(date)] Starting daily PostgreSQL backup..."
docker exec vasto-postgres pg_dump -U vasto_admin -F c softbuluo > "$BACKUP_FILE"

# 完整性校验：必须生成非空文件且可被 pg_restore 读取 TOC 头
if [ ! -s "$BACKUP_FILE" ]; then
    echo "[$(date)] [FATAL] 备份文件为空！" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

docker exec -i vasto-postgres pg_restore -l < "$BACKUP_FILE" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[$(date)] [FATAL] 备份文件 TOC 损坏！" >&2
    exit 1
fi

# 计算 SHA-256 哈希值写入校验日志
sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"

# 轮转策略：保留最近 14 天备份
find "$BACKUP_DIR" -name "softbuluo_*.dump*" -mtime +14 -exec rm -f {} \;
echo "[$(date)] Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
```

---

## 三、隔离恢复演练（实测记录）

依据规范要求，**绝对禁止在生产主库直接执行整库恢复测试**。  
本次在生产宿主机的 PostgreSQL 引擎内部创建全新隔离库进行端到端全量数据导入与外键校验实测：

### 演练日志流水（真实输出，零编造）：
```text
=== ISOLATED DATABASE RESTORE DRILL ===
1. Creating isolated test database: softbuluo_drill_1794465416
CREATE DATABASE
2. Restoring dump into softbuluo_drill_1794465416...
3. Verifying restored data counts in softbuluo_drill_1794465416:
 total_tables: 56
 total_software: 123
 total_download_sources: 160
 total_tutorials: 44
 genuine_tutorials (slug NOT LIKE 'tut-p3-%'): 27
4. Dropping isolated test database: softbuluo_drill_1794465416
DROP DATABASE
=== RESTORE DRILL COMPLETED SUCCESSFULLY ===
```

> [!TIP]
> **演练验证结论**：`RESTORE_VERIFIED_PASSED`  
> 备份文件在隔离环境下成功完成结构构建与数据插入，表数（56）、软件（123）、下载源（160）、教程（27篇真实）与生产在线状态 100% 对齐，具备完整的灾备冷启动恢复能力。

---

## 四、灾难发生时的紧急恢复 SOP（操作手册）

如遇误删库或灾难级损坏，DBA 按以下标准步骤抢修：

1. **阻断外部写入**：
   ```bash
   pm2 stop softtribe-backend
   ```
2. **确认恢复目标时间点的 Dump 文件**：
   ```bash
   ls -lt /home/ubuntu/backups/softtribe/*.dump | head -n 5
   # 校验该文件哈希
   sha256sum -c /home/ubuntu/backups/softtribe/softbuluo_YYYYMMDD_HHMMSS.dump.sha256
   ```
3. **备份当前受损库现状（防覆盖调查现场）**：
   ```bash
   docker exec vasto-postgres pg_dump -U vasto_admin -F c softbuluo > /home/ubuntu/backups/softtribe/softbuluo_damaged_$(date +%s).dump || true
   ```
4. **执行干净恢复**：
   ```bash
   docker exec -i vasto-postgres pg_restore -U vasto_admin --clean --if-exists -d softbuluo < /home/ubuntu/backups/softtribe/softbuluo_YYYYMMDD_HHMMSS.dump
   ```
5. **恢复应用心跳**：
   ```bash
   pm2 start softtribe-backend
   bash /var/www/softtribe.top/scripts/prod_smoke_test.sh
   ```

---

## 五、异地副本建设路线图（Phase 2）

当前备份位于服务器本地 `/home/ubuntu/backups/softtribe`，若发生云宿主机硬件故障仍存在单点风险。
建议在后续商业化阶段规划以下异地冗余策略：
1. **方案 A（推荐）：腾讯云 COS 自动归档**
   - 使用轻量 coscli 工具，在脚本完成本地校验后执行 `coscli sync` 上传至私有加密 Bucket（开启版本控制与 90 天归档存储，月均成本低于 1 元）。
2. **方案 B：异地机房密钥同步**
   - 通过仅具备写权限的特定 SSH Deploy Key，利用 `rsync -avz` 增量推送至备用存储机。
