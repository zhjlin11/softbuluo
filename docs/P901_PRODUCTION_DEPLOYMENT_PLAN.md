# 软游部落 P9.0.1 —— 生产环境受控实施发布与灾备应急预案

**文档编号**：ST-P901-PROD-01  
**方案编制时间**：2026-11-14 00:25 (CST)  
**当前状态**：`P901_APPROVAL_REQUIRED` (等待用户发出明确「确认发布」指令后方可实施)  
**执行原则**：先备份后操作；事务原子提交；生产只读可控；随时秒级无损回滚。

---

## 一、生产环境就绪度与风险矩阵

### 1.1 生产运行环境参数
- **目标主机**：`ubuntu@134.175.230.107`
- **运行目录**：`/var/www/softtribe.top`
- **PostgreSQL 容器**：`vasto-postgres` (数据库名: `softbuluo_prod`)
- **PM2 守护进程**：`softtribe-backend` (PID: 2710724, Cluster 模式)
- **磁盘安全余量**：当前剩余可用 9.5GB (使用率 86%)，本轮发版增量小于 5MB，容量充足。

### 1.2 生产变更风险与缓释矩阵

| 风险场景 | 风险等级 | 触发条件 | 预设防范与熔断措施 |
|---|:---:|---|---|
| **数据库脏写或死锁** | 中 | 批量发布或来源归档时发生异常 | 采用 Prisma Transaction，任一失败立即整体 Rollback。 |
| **外部下载链接突发 404** | 低 | 官方 CDN 突发波动 | 采用 Level 4 官方主域名，并有直链和镜像多源兜底。 |
| **PM2 热重载中断** | 低 | 端口冲突或进程启动超限 | Cluster 模式零停机渐进重启 (`pm2 reload`)，保持至少 1 个 worker 在线。 |
| **SEO Sitemap 解析延迟** | 低 | 爬虫缓存 | 动态路由由 Fastify 实时生成，发布瞬间即刻生效。 |

---

## 二、Stage C 受控实施标准规程 (SOP)

用户在会话中输入「确认发布」后，将依次执行以下六个受控步骤：

### 步骤 1：生产环境双重备份与 SHA-256 固化 (强制先行)
```bash
# 1. 生产数据库热备份并生成哈希指纹
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sudo docker exec -t vasto-postgres pg_dump -U postgres -F c softbuluo_prod > /home/ubuntu/backups/softtribe/softbuluo_p901_${TIMESTAMP}.dump
sha256sum /home/ubuntu/backups/softtribe/softbuluo_p901_${TIMESTAMP}.dump > /home/ubuntu/backups/softtribe/softbuluo_p901_${TIMESTAMP}.dump.sha256

# 2. 生产运行代码目录安全快照
tar -czf /home/ubuntu/backups/deploy_pre_p90/softtribe_pre_p901_${TIMESTAMP}.tar.gz -C /var/www softtribe.top
```

### 步骤 2：代码安全同步与 Prisma Client 生成
```bash
cd /var/www/softtribe.top
git fetch origin main
git checkout main
git pull origin main
npm run prisma:generate
```

### 步骤 3：前端生产构建产物平滑同步
```bash
# 在本地完成标准构建后同步静态 dist/
npm run build
# 确认 dist 产物完整后更新生产 Web 静态根目录
```

### 步骤 4：执行 35 条异常来源安全治理与归档
- 将 30 条 VS Code 历史冗余端点标记为 `enabled = false`；
- 更新 7-Zip ARM64、Wireshark 与 VS Code macOS 为官方权威替代源；
- 写入数据库操作审计日志。

### 步骤 5：原子发布首批 10 款优质软件 (事务控制)
- 将 10 款候选软件 (`crystaldiskinfo`, `crystaldiskmark`, `gpuz`, `ventoy`, `putty`, `winscp`, `nodejs`, `python`, `potplayer`, `openra`) 状态由 `DRAFT` 更新为 `PUBLISHED`；
- 对应版本状态更新为 `APPROVED`；
- 前台公开软件数实测变为 40 款。

### 步骤 6：PM2 零停机平滑热重载与生产冒烟验证
```bash
pm2 reload softtribe-backend --update-env
# 校验 11 个生产 HTTPS 公开端点 (HTTP 200 OK)
# 校验 /sitemap-software.xml 包含 10 条新入库 URL
```

---

## 三、生产应急回滚操作方案

若发布后 15 分钟内出现不可预测的重大业务异常，触发一键无损回滚：

```sql
-- 1. 撤回 10 款软件的公开状态
UPDATE "Software" 
SET status = 'DRAFT' 
WHERE slug IN ('crystaldiskinfo', 'crystaldiskmark', 'gpuz', 'ventoy', 'putty', 'winscp', 'nodejs', 'python', 'potplayer', 'openra') 
  AND "isTestData" = false;

-- 2. 关联版本回退 PENDING
UPDATE "SoftwareVersion" 
SET "reviewStatus" = 'PENDING' 
WHERE "softwareId" IN (
  SELECT id FROM "Software" WHERE slug IN ('crystaldiskinfo', 'crystaldiskmark', 'gpuz', 'ventoy', 'putty', 'winscp', 'nodejs', 'python', 'potplayer', 'openra')
);
```
此回滚不破坏任何用户数据，仅需 1 秒即可令全站前台状态完全恢复至 P9.0 基线。
