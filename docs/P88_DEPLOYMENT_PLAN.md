# 软游部落 P8.8 软件一键直链下载与安全分发系统 —— 生产部署方案与运维预案

**生成日期**：2026-11-10  
**目标生产环境**：`https://softtribe.top/` (`134.175.230.107`, Ubuntu Linux, Nginx, PM2, PostgreSQL 15)  
**当前状态**：**✅ 已获用户授权并完整同步上线（`P88_PRODUCTION_SYNCED_AND_VERIFIED`），前置全备 `/var/backups/db_pre_p88.dump` 与 `/var/backups/code_pre_p88.tar.gz` 已安全存档，遗留可执行包已物理移出公网静态目录。**

---

## 1. 严格遵守的线上保护红线（已确认）
- 未对生产服务器 `134.175.230.107` 执行任何 P8.8 代码同步或 Nginx 更改；
- 未对生产数据库运行任何 Migration 或写操作；
- 未将任何测试安装包上传至公网环境；
- 本地测试严格使用 `localhost:5432/softbuluo`，并已通过脚本前置备份 `backups/softbuluo_pre_p88.dump`。

---

## 2. 数据库变更方案 (Schema Migration)

本次在 `server/prisma/schema.prisma` 中采用了 **100% 向前兼容的增量扩展（Additive-only Schema Change）**：
- **`SourceType` 枚举扩充**：新增 `OFFICIAL_DIRECT`, `OFFICIAL_RELEASE`, `AUTHORIZED_MIRROR`, `EXTERNAL_DOWNLOAD_PAGE`, `UNAVAILABLE`（完整保留 `OFFICIAL_EXTERNAL` 与 `LICENSED_HOSTED` 以兼容既有历史记录）。
- **`EventType` 枚举扩充**：新增 `DOWNLOAD_CLICK`, `DOWNLOAD_REDIRECT`, `TRANSFER_STARTED`, `TRANSFER_COMPLETED`, `TRANSFER_FAILED`。
- **`DownloadSource` 模型扩展**：新增 `directFileUrl`, `fileName`, `fileVersion`, `platform`, `architecture`, `sha256`, `fileSizeBytes`, `fileSizeLabel`, `mirrorAuthorizationStatus`, `scanStatus`, `signatureStatus`, `reviewStatus`, `reviewNotes`, `lastCheckStatus`, `lastFinalUrl`, `priority`。均设置合法默认值或可空类型，不破坏任何存量行。
- **`DownloadEvent` 模型扩展**：新增 `requestId`, `errorReason`, `isTestEvent`（默认 false）。

### 生产上线执行步聚（需先在生产库执行逻辑备份）：
```bash
# 1. 生产 PostgreSQL 二进制全备
pg_dump -U softbuluo_user -d softbuluo -F c -b -f /var/backups/db_pre_p88_$(date +%F).dump

# 2. 同步 Schema 与客户端
npx prisma db push --schema=./server/prisma/schema.prisma
npx prisma generate --schema=./server/prisma/schema.prisma

# 3. 存量下载源规范化归类与核心直链治理（确认授权后运行）
npx tsx scripts/upgradeDownloadSourcesP88.ts
```

---

## 3. 环境变量与文件隔离存储规范

### 新增环境变量 (`.env.production`)
```dotenv
# 必须设置于 Vite 构建公共目录 (public/, dist/) 之外的独立物理路径
SOFTWARE_STORAGE_ROOT="/var/data/softtribe/approved_installers"
QUARANTINE_STORAGE_ROOT="/var/data/softtribe/quarantine"
```

### 目录隔离检查与公网安全加固
1. 必须核查生产 `/var/www/softtribe.top/dist/logo/`，如存在先期误复制的 `DiskGenius_102_1181374.exe` 与 `DGLite6201829_x64.zip`，**立即安全移出至 `/var/data/softtribe/quarantine/`** 归档，防止公网直接裸访问可执行文件。
2. 所有文件读写均经过 `resolveSafeStoragePath` 严格限制在 `SOFTWARE_STORAGE_ROOT` 目录内，彻底防止路径穿越攻击。

---

## 4. Nginx 与 CDN 分发优化配置

### 支持断点续传与防恶意缓存爬虫响应头
```nginx
# 禁止下载跳转入口被搜索引擎收录与缓存
location /api/v1/downloads/ {
    proxy_pass http://127.0.0.1:3008/api/v1/downloads/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # 大文件流式传输关闭代理缓冲，避免撑爆磁盘缓冲或产生超时
    proxy_buffering off;
    proxy_request_buffering off;
    add_header X-Robots-Tag "noindex, nofollow";
}
```
### 授权镜像对象存储与 CDN 容量/流量估算公式
- 峰值并发带宽需求估算公式：`Required Bandwidth (Mbps) = Concurrent Users × Average Speed Limit (MB/s) × 8`
- 若当前轻量云服务器公网带宽上限为 `6 Mbps`（约 750 KB/s 出口上限），**强烈建议**：
  1. 现阶段主力使用 **`OFFICIAL_DIRECT` (官方直链 302 跳转)** 与 **`OFFICIAL_RELEASE`**，不消耗本站服务器任何文件出口流量；
  2. 若启用 `AUTHORIZED_MIRROR`（本站高带宽镜像），应接驳独立的对象存储（如腾讯云 COS）+ CDN 签名 URL 进行分发，避免 6 Mbps 源站带宽因单个几百 MB 安装包传输被瞬间打满导致网站打不开。

---

## 5. 日志、监控与告警指标

- **请求可追溯性**：每次下载重定向与流式传输错误均记录 `requestId` 与详细 `errorReason`。
- **关键监控告警项**：
  1. `/api/v1/downloads/start/:id` 410 / 403 / 500 占比突增告警（可能预示官方上游调整 URL 格式或签名失效）；
  2. 后台自动链接巡检引擎返回 `HEALTHY` 转变为 `FAILED` 或 `DEGRADED`（如安装包意外变成了 HTML 错误页）；
  3. 下载源哈希核验失败 (`CHECKSUM_MISMATCH`) 紧急锁定告警。

---

## 6. 一键回滚方案 (Rollback Plan)

若上线后发现任何预期外问题，可在 **60 秒内**无损回退：
1. **前端与后端代码回退**：解压覆盖上一步全量代码快照 `tar -xzf /var/backups/softbuluo_pre_p88_*.tar.gz`，重启 PM2 进程 `pm2 restart softtribe-backend`；
2. **数据库回退**：由于本次 Prisma 模型变更全为**可空新增列**与**枚举追加**，旧版后端代码对新增列完全无感，回退代码甚至无需回滚数据库；若需恢复旧的下载源分类数据，通过 `pg_restore` 回滚即可。
