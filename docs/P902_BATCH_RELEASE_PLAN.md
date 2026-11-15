# 软游部落 P9.0.2 —— 第二批优质软件受控增量发布方案

## 一、发布方案定位与目标

本方案是软游部落 **P9.0.2 第二批优质软件资源深度审核、官方版本核验与增量发布工程** 的正式发布蓝图。

- **阶段模式**：本阶段为 **Stage A（本地开发与合规校验）+ Stage B（隔离回归与演练）**。
- **发布原则**：未经用户本轮明确授权口令（如“确认发布 P9.0.2”），**严禁直接修改生产数据库，严禁执行生产发布**。
- **发布受控范围**：严格限定为第二批 10 款已通过深度审核的优质软件。

---

## 二、第二批发布候选对象与数据库变更集清单

| 序号 | 软件 Slug | 数据库 ID | 当前状态 | 目标状态 | 关联版本号 | 关联官方下载源 ID | 来源类型 |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **01** | `sharex` | `cmw8wtveo000xvki8tx3166b0` | `DRAFT` | `PUBLISHED` | `16.1.0` | `cmw8wtveq0013vki8b89ydlub` | `EXTERNAL_DOWNLOAD_PAGE` |
| **02** | `handbrake` | `cmw8wtvek000pvki8fo317m6x` | `DRAFT` | `PUBLISHED` | `1.8.2` | `cmw8wtvem000vvki82he1l145` | `EXTERNAL_DOWNLOAD_PAGE` |
| **03** | `notepad-plus-plus` | `cmw8wtvha006xvki8zb4xyara` | `DRAFT` | `PUBLISHED` | `8.7.1` | `cmw8wtvhc0073vki8la8fll8n` | `EXTERNAL_DOWNLOAD_PAGE` |
| **04** | `gimp` | `cmw8wtvim009tvki8upgm1iyb` | `DRAFT` | `PUBLISHED` | `2.10.38` | `cmw8wtvio009zvki8z9g94ylf` | `EXTERNAL_DOWNLOAD_PAGE` |
| **05** | `process-explorer` | `cmw8wtvjg00btvki8cq0b26tc` | `DRAFT` | `PUBLISHED` | `17.06` | `cmw8wtvjj00bzvki8a3km6wmp` | `OFFICIAL_DIRECT` |
| **06** | `autoruns` | `cmw8wtvjl00c1vki8420b7cjz` | `DRAFT` | `PUBLISHED` | `14.11` | `cmw8wtvjm00c7vki8pefdexls` | `OFFICIAL_DIRECT` |
| **07** | `audacity` | `cmw8wtvj300axvki8y2r298fz` | `DRAFT` | `PUBLISHED` | `3.7.1` | `cmw8wtvj500b3vki8uywkmkd0` | `EXTERNAL_DOWNLOAD_PAGE` |
| **08** | `sumatrapdf` | `cmw8wtvhv0089vki86v6gz030` | `DRAFT` | `PUBLISHED` | `3.5.2` | `cmw8wtvhy008fvki81bdxzaug` | `EXTERNAL_DOWNLOAD_PAGE` |
| **09** | `memtest86` | `cmw8wtvfj002xvki808bom4aq` | `DRAFT` | `PUBLISHED` | `11.1` | `cmw8wtvfl0033vki8go3v5k7r` | `EXTERNAL_DOWNLOAD_PAGE` |
| **10** | `windows-terminal` | `cmw8wtvhh007dvki80x71134z` | `DRAFT` | `PUBLISHED` | `1.21.3231` | `cmw8wtvhj007jvki8jylfw9yt` | `EXTERNAL_DOWNLOAD_PAGE` |

---

## 三、数据库发布操作原子级事务设计

发布执行脚本封装在单一 `prisma.$transaction` 块内，确保任一步骤失败自动全量回滚：

```typescript
const CANDIDATE_SLUGS = [
  'sharex', 'handbrake', 'notepad-plus-plus', 'gimp', 'process-explorer',
  'autoruns', 'audacity', 'sumatrapdf', 'memtest86', 'windows-terminal'
];

await prisma.$transaction(async (tx) => {
  // 1. 批量将 10 款软件由 DRAFT 更新为 PUBLISHED
  const updatedSoftware = await tx.software.updateMany({
    where: {
      slug: { in: CANDIDATE_SLUGS },
      status: 'DRAFT',
      isTestData: false
    },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      dataIntegrityStatus: 'VERIFIED_COMPLETE',
      officialDomainVerified: true
    }
  });

  if (updatedSoftware.count !== 10) {
    throw new Error(`发布数量异常，预期 10 款，实际更新 ${updatedSoftware.count} 款`);
  }

  // 2. 批量将对应版本审核状态标记为 APPROVED
  await tx.softwareVersion.updateMany({
    where: {
      software: { slug: { in: CANDIDATE_SLUGS } }
    },
    data: {
      reviewStatus: 'APPROVED'
    }
  });

  // 3. 批量激活对应下载来源
  await tx.downloadSource.updateMany({
    where: {
      version: { software: { slug: { in: CANDIDATE_SLUGS } } }
    },
    data: {
      isActive: true,
      reviewStatus: 'APPROVED',
      lastCheckStatus: 'HEALTHY'
    }
  });

  // 4. 写入审计日志流水
  await tx.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'PUBLISH_SOFTWARE_BATCH_P902',
      targetType: 'SOFTWARE_BATCH',
      targetId: 'batch-p902-10items',
      after: JSON.stringify({
        publishedSlugs: CANDIDATE_SLUGS,
        publishedCount: 10,
        publishedAt: new Date().toISOString()
      })
    }
  });
});
```

---

## 四、生产发布前后数据指标变化预测

| 数据库资源指标 | P9.0.1 现有基线 | P9.0.2 发布后目标基线 | 增量与状态说明 |
| :--- | :---: | :---: | :--- |
| **已发布非测试软件总数** | **40 款** | **50 款** | 净增 10 款高价值开源与经典工具 |
| ├─ 电脑软件 (`SOFTWARE`) | 14 款 | 17 款 | 净增 3 款（HandBrake, GIMP, Audacity） |
| ├─ 系统工具 (`TOOL`) | 23 款 | 30 款 | 净增 7 款（Process Explorer, Autoruns, ShareX, Notepad++, Sumatra PDF, MemTest86, Windows Terminal） |
| └─ 游戏中心 (`GAME`) | 3 款 | 3 款 | 保持不变 |
| **非测试草稿储备 (`DRAFT`)** | 51 款 | 41 款 | 保持充沛储备，供未来 P9.0.3 增量发布 |
| **隔离测试软件 (`isTestData = true`)** | 30 款 | 30 款 | 严格隔离，零外泄 |
| **有效下载来源 (`isActive = true`)** | 114 条 | 124 条 | 净增 10 条经过核验的官方直链/发布源 |
| **动态 Sitemap 收录软件数** | 40 条 | 50 条 | 自动动态生效，无需手工配置 |

---

## 五、发布方案验收标准

1. **事务完整性**：10 款软件状态更新与下载源激活 100% 成功，审计日志完整落库；
2. **前台即时可见**：`/software`、`/system-tools` 频道及 `/updates` 发版流即刻呈现 10 款新发布工具；
3. **七大导航零破损**：七大主导航顺序、图标与结构 100% 完好；
4. **历史路由 200 可达**：`/compare` 与 `/community` 稳定提供服务；
5. **SEO 自动同步**：`sitemap-software.xml` 与 `sitemap-tools.xml` 自动增加 10 条规范 URL。
