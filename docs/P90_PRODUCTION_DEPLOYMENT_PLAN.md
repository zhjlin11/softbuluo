# 软游部落 P9.0 —— 生产发布实施方案、风险矩阵与回滚预案

**文件标识**：ST-P90-DEP-01  
**编制时间**：2026-11-12  
**责任角色**：生产发布与灾难恢复负责人 & Senior SRE  
**实施状态**：`STAGE_A_COMPLETED (待用户正式签署发布指令后执行 Stage B/C)`

---

## 一、发布总体原则与实施分期

遵循任务书第二十八、二十九节的安全准则，本次 P9.0 严格实行**分阶段受控发布策略**：

```mermaid
flowchart LR
    A["Stage A: 基础设施建设<br/>(当前阶段: 本地闭环/0生产写入)"] -->|用户签署批准| B["Stage B: 运营数据治理<br/>(候选补全/35条死链工单核验)"]
    B -->|用户二次确认| C["Stage C: 受控生产发布<br/>(构建同步/PM2热重载/烟雾验收)"]
```

- **Stage A（当前已完成）**：完成运营后台接口、版本检测算法、反 SSRF 引擎、SRE 租约锁与多视口浏览器验收，全量 28 套测试 824 项全部通过。**绝不在未经授权下向生产数据库写入或上传代码。**
- **Stage B（数据准备）**：基于现有数据库的 62 款草稿软件与 35 条 404 链接生成离线待办工单，完善官网域名、SHA-256、安装参数与替代直链。
- **Stage C（受控上线）**：在用户明确下达 `确认发布` 指令后，执行严格的原子发布与平滑热重载。

---

## 二、生产环境发布实施详细步骤 (Stage C)

### 步骤 1：生产环境前置快照备份 (SRE 强制规程)
在任何操作前，通过 SSH 连接服务器并执行全量前置备份：
```bash
ssh ubuntu@134.175.230.107
# 1. 触发即时数据库全量逻辑备份并生成校验和
/bin/bash /home/ubuntu/scripts/backup_db_daily.sh

# 2. 归档当前生产代码目录
mkdir -p /home/ubuntu/backups/deploy_pre_p90
tar -czf /home/ubuntu/backups/deploy_pre_p90/softtribe_pre_p90_$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude='node_modules' --exclude='.git' -C /var/www/softtribe.top .
```

### 步骤 2：本地工程构建打包与安全传输
在本地 Windows 执行编译并打包交付件：
```bash
npm run build
tar -czf dist_p90_deploy.tar.gz dist/ server/ package.json
scp dist_p90_deploy.tar.gz ubuntu@134.175.230.107:/tmp/
```

### 步骤 3：生产服务器代码同步与依赖校验
```bash
ssh ubuntu@134.175.230.107
# 解压覆盖至生产目录
tar -xzf /tmp/dist_p90_deploy.tar.gz -C /var/www/softtribe.top
rm -f /tmp/dist_p90_deploy.tar.gz

cd /var/www/softtribe.top
npm install --omit=dev --prefer-offline
```

### 步骤 4：PM2 集群平滑重载
```bash
# 执行 cluster 模式零停机热重载
pm2 reload softtribe-backend --update-env
pm2 status
```

### 步骤 5：生产线上全量端点冒烟验收
执行生产线上冒烟脚本（检查 7 大频道与核心 API）：
```bash
/bin/bash /var/www/softtribe.top/scripts/prod_smoke_test.sh
```

---

## 三、生产发布风险评估矩阵

| 风险项 | 风险等级 | 潜在影响 | 预防与防御策略 |
| :--- | :---: | :--- | :--- |
| **磁盘空间不足** | **中高** | 当前磁盘占用 86% (9.6GB 可用)，若归档包过大可能触发报警 | 上传包控制在 25MB 内，解压后立即删除 `/tmp/` 临时归档，部署后清理 7 天前 journal 日志 |
| **PM2 热重载抖动** | **低** | Cluster 多 Worker 切换时短暂返回 502 | Nginx 已配置 `proxy_next_upstream error timeout http_502`，自动重试健康 Worker |
| **外部下载链接探测超时** | **低** | 目标官方服务器防御策略导致探测挂起 | 探测器强加 10 秒超时中断，HEAD 失败自动回退 Range GET，403 标为待审而非死链 |
| **内网 SSRF 渗透风险** | **高** | 恶意配置触发云服务器元数据泄露 | 探测引擎已部署严格逐跳 IP 过滤，强力拦截 `169.254.x` 与 `127.0.0.1` |

---

## 四、生产灾难恢复与回滚预案 (Rollback Playbook)

若上线后出现主频道打不开、接口大面积 500、数据库异常等 P0/P1 阻断性故障，必须在 5 分钟内执行紧急回滚：

### 4.1 代码回滚命令
```bash
ssh ubuntu@134.175.230.107
LATEST_BACKUP=$(ls -t /home/ubuntu/backups/deploy_pre_p90/softtribe_pre_p90_*.tar.gz | head -1)
tar -xzf "$LATEST_BACKUP" -C /var/www/softtribe.top
pm2 reload softtribe-backend
```

### 4.2 数据库应急恢复命令
```bash
ssh ubuntu@134.175.230.107
LATEST_DB=$(ls -t /home/ubuntu/backups/softtribe/softbuluo_*.dump | head -1)
# 在临时库校验后，回滚至主生产库
docker exec -i vasto-postgres pg_restore -U vasto_admin -d softbuluo --clean "$LATEST_DB"
```

---

## 五、发布签署与授权流程

只有在用户阅读本报告及 `docs/P90_FINAL_REPORT.md`，并在控制台下达明确指令（例如：`确认发布`）后，方可启动 Stage C 生产部署。
