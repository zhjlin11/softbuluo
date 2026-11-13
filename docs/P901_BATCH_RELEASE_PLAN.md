# 软游部落 P9.0.1 —— 首批 10 款优质资源批次发布方案与原子回滚预案

**文档编号**：ST-P901-REL-01  
**方案拟定时间**：2026-11-14 00:05 (CST)  
**当前状态**：`P901_LOCAL_PASSED` / `P901_APPROVAL_REQUIRED` (本地演练完毕，生产等待批准)  
**发布原则**：小步快跑、逐批核验、事务原子、业务数据零丢失、可逆无损回滚。

---

## 一、首批建议发布的 10 款软件清单 (Stage B)

经 Stage A 严格审计与打分，以下 10 款软件全部满足：
1. 审核得分 >= 90 分；
2. 零阻断项（无 404、无架构错配、非盗版、非测试数据）；
3. 官方原厂或权威开源托管托管源；
4. 广泛的用户基数与极高口碑，且已适配 Windows 10/11。

| 序号 | 软件中文名称 | 英文标识 (Slug) | 目标主栏目 | 开发者 | 许可协议 | 当前版本 | 架构 |
|:---:|---|---|---|---|---|---|---|
| **1** | **CrystalDiskInfo** | `crystaldiskinfo` | 系统工具 (`system-tools`) | hiyohiyo / Crystal Dew World | MIT | 9.4.4 | x64 / x86 |
| **2** | **CrystalDiskMark** | `crystaldiskmark` | 系统工具 (`system-tools`) | hiyohiyo / Crystal Dew World | MIT | 8.0.5 | x64 / x86 |
| **3** | **TechPowerUp GPU-Z** | `gpuz` | 系统工具 (`system-tools`) | TechPowerUp | 免费软件 (Freeware) | 2.60.0 | x64 / x86 |
| **4** | **Ventoy** | `ventoy` | 系统工具 (`system-tools`) | longpanda | GPL-3.0 | 1.0.99 | 跨平台/USB |
| **5** | **PuTTY** | `putty` | 电脑软件 (`software`) | Simon Tatham | MIT | 0.81 | x64 / ARM64 |
| **6** | **WinSCP** | `winscp` | 电脑软件 (`software`) | Martin Přikryl | GPL-3.0 | 6.3.5 | x64 |
| **7** | **Node.js LTS** | `nodejs` | 电脑软件 (`software`) | OpenJS Foundation | MIT | 20.18.1 (LTS) | x64 / ARM64 |
| **8** | **Python 3** | `python` | 电脑软件 (`software`) | Python Software Foundation | PSF License | 3.12.7 | x64 |
| **9** | **PotPlayer** | `potplayer` | 电脑软件 (`software`) | Kakao Corporation | 免费软件 (Freeware) | 240924 | x64 / x86 |
| **10** | **OpenRA (红色警戒开源版)** | `openra` | 游戏中心 (`games`) | OpenRA Developers | GPL-3.0 | release-20231010 | x64 |

---

## 二、生产发布数据变更影响预测

- **发布前公开发布软件**：30 款（13 软件 + 15 工具 + 2 游戏）
- **首批批准发布软件**：**10 款**（5 软件 + 4 工具 + 1 游戏）
- **发布后公开发布软件**：**40 款**（18 软件 + 19 工具 + 3 游戏）
- **发布后保留草稿软件**：**52 款**（由 62 款扣除 10 款；生产库由 63 款扣除 10 款并核销 1 款重名后为 52 款）
- **隔离测试数据**：30 款保持隔离状态不变 (`isTestData = true`)
- **Sitemap 自动更新**：`/sitemap-software.xml` 增加 10 条真实 URL，主 Sitemap 索引即时生效。

---

## 三、发布技术操作规程 (事务原子化)

发布操作必须在数据库事务中一次性完成，绝不允许出现部分发布成功、部分失败的脏状态：

```typescript
// 批次发布原子事务伪代码范式（已在 server/tests/p901ResourcePublishingTest.ts 严格验证）
await prisma.$transaction(async (tx) => {
  // 1. 记录发布前审计快照
  const batchId = `P901_BATCH_1_${Date.now()}`;
  
  // 2. 批量将经过审核的 10 款软件状态更新为 PUBLISHED
  const updated = await tx.software.updateMany({
    where: {
      slug: { in: APPROVED_SLUGS },
      status: ResourceStatus.DRAFT,
      isTestData: false
    },
    data: {
      status: ResourceStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  // 3. 关联版本审核状态同步为 APPROVED
  await tx.softwareVersion.updateMany({
    where: {
      software: { slug: { in: APPROVED_SLUGS } },
      reviewStatus: 'PENDING'
    },
    data: { reviewStatus: 'APPROVED' }
  });

  // 4. 写入操作审计日志
  await tx.auditLog.create({
    data: {
      action: 'BATCH_PUBLISH_APPROVED',
      entityType: 'SOFTWARE_BATCH',
      entityId: batchId,
      details: JSON.stringify({ count: updated.count, slugs: APPROVED_SLUGS, operator: 'admin' })
    }
  });
});
```

---

## 四、细粒度无损回滚预案 (Rollback Playbook)

如在生产发布后发现外部网络波动或页面展示异常，**严禁回滚整个数据库**（避免丢失发布后真实用户产生的新增数据、收藏与下载打点），必须执行以下细粒度撤回操作：

### 4.1 细粒度撤回 SQL 指令
```sql
-- 仅撤回本批次 10 款软件状态回退至 DRAFT，不触及任何用户表与其它业务数据
UPDATE "Software" 
SET status = 'DRAFT' 
WHERE slug IN ('crystaldiskinfo', 'crystaldiskmark', 'gpuz', 'ventoy', 'putty', 'winscp', 'nodejs', 'python', 'potplayer', 'openra') 
  AND "isTestData" = false;

-- 关联版本状态退回 PENDING
UPDATE "SoftwareVersion" 
SET "reviewStatus" = 'PENDING' 
WHERE "softwareId" IN (
  SELECT id FROM "Software" WHERE slug IN ('crystaldiskinfo', 'crystaldiskmark', 'gpuz', 'ventoy', 'putty', 'winscp', 'nodejs', 'python', 'potplayer', 'openra')
);
```

### 4.2 回滚后验收核验
1. 访问前台页面，确认公开发布软件数量准确恢复为 30 款。
2. 访问撤回软件详情页，确认返回 HTTP 404（草稿隔离生效）。
3. 检查用户评论与收藏记录，确认 0 丢失、0 污染。
