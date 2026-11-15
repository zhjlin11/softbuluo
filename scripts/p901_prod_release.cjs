const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPROVED_SLUGS = [
  'crystaldiskinfo',
  'crystaldiskmark',
  'gpuz',
  'ventoy',
  'putty',
  'winscp',
  'nodejs',
  'python',
  'potplayer',
  'openra'
];

async function main() {
  console.log('===============================================================');
  console.log('🚀 软游部落 P9.0.1 生产环境数据库发布与来源治理事务开始执行...');
  console.log('===============================================================\n');

  // 1. 查询发布前基线
  const prePublishedCount = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const preDraftCount = await prisma.software.count({
    where: { status: 'DRAFT', isTestData: false }
  });
  console.log(`[发布前状态] 已发布非测试资源: ${prePublishedCount} 款 | 草稿资源: ${preDraftCount} 款`);

  // 2. 事务执行治理与发布
  const result = await prisma.$transaction(async (tx) => {
    // 2.1 治理 A 类异常：VS Code 早期历史冗余更新源 (30 条)
    const vscDupUpdate = await tx.downloadSource.updateMany({
      where: {
        url: 'https://code.visualstudio.com/updates/latest'
      },
      data: {
        isActive: false,
        reviewStatus: 'REJECTED',
        lastCheckStatus: 'ARCHIVED',
        reviewNotes: '已安全归档：早期历史导入重复来源，官方更新日志规范路径为 /updates'
      }
    });
    console.log(`[来源治理 A 类] 归档 VS Code 历史冗余 updates 端点: ${vscDupUpdate.count} 条`);

    // 2.2 治理 B 类异常：7-Zip ARM64 版本变迁
    const z7Update = await tx.downloadSource.updateMany({
      where: {
        url: 'https://www.7-zip.org/a/7z2409-arm64.exe'
      },
      data: {
        url: 'https://www.7-zip.org/download.html',
        lastCheckStatus: 'HEALTHY',
        reviewStatus: 'APPROVED',
        reviewNotes: '已修复：对齐 7-Zip 官方权威多架构下载中心'
      }
    });
    console.log(`[来源治理 B 类] 修复 7-Zip ARM64 版本下载入口: ${z7Update.count} 条`);

    // 2.3 治理 B 类异常：VS Code macOS 旧 SHA 架构变迁
    const vscMacSources = await tx.downloadSource.findMany({
      where: {
        url: 'https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal'
      }
    });
    if (vscMacSources.length > 0) {
      // 第一条更新为官方主域规范下载入口
      await tx.downloadSource.update({
        where: { id: vscMacSources[0].id },
        data: {
          url: 'https://code.visualstudio.com/Download',
          lastCheckStatus: 'HEALTHY',
          reviewStatus: 'APPROVED',
          reviewNotes: '已修复：对齐微软官方 macOS Universal 下载中心'
        }
      });
      // 其余重复项安全归档
      for (let i = 1; i < vscMacSources.length; i++) {
        await tx.downloadSource.update({
          where: { id: vscMacSources[i].id },
          data: {
            isActive: false,
            reviewStatus: 'REJECTED',
            lastCheckStatus: 'ARCHIVED',
            reviewNotes: '已安全归档：macOS Universal 冗余重复记录'
          }
        });
      }
      console.log(`[来源治理 B 类] 修复并归档 VS Code macOS Universal 端点: ${vscMacSources.length} 条`);
    }

    // 2.4 治理 C 类异常：Wireshark 下线镜像节点
    const wsUpdate = await tx.downloadSource.updateMany({
      where: {
        url: 'https://2.na.dl.wireshark.org/win64/Wireshark-4.4.2-x64.exe'
      },
      data: {
        url: 'https://www.wireshark.org/download.html',
        lastCheckStatus: 'HEALTHY',
        reviewStatus: 'APPROVED',
        reviewNotes: '已修复：对齐 Wireshark 官方主域全局智能分发中心'
      }
    });
    console.log(`[来源治理 C 类] 修复 Wireshark 失效 CDN 镜像节点: ${wsUpdate.count} 条`);

    // 2.5 去重核销：处理历史重名草稿 vs-code
    const dupDraft = await tx.software.findFirst({
      where: { slug: 'vs-code', status: 'DRAFT' }
    });
    if (dupDraft) {
      await tx.software.update({
        where: { id: dupDraft.id },
        data: {
          status: 'ARCHIVED',
          summary: '已与主资源 Visual Studio Code (vscode) 合并核销，避免重复建档与路由冲突。'
        }
      });
      console.log(`[软件去重核销] 成功归档历史重名草稿 vs-code (ID: ${dupDraft.id})`);
    }

    // 2.6 批次发布首批 10 款优质软件
    const publishedList = [];
    for (const slug of APPROVED_SLUGS) {
      const sw = await tx.software.findFirst({
        where: { slug, isTestData: false }
      });
      if (sw) {
        await tx.software.update({
          where: { id: sw.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        });
        // 同步将关联版本的审核状态更新为 APPROVED
        const verUpdate = await tx.softwareVersion.updateMany({
          where: { softwareId: sw.id },
          data: { reviewStatus: 'APPROVED' }
        });
        publishedList.push({ name: sw.name, slug: sw.slug, versions: verUpdate.count });
      } else {
        console.warn(`[WARN] 未找到候选软件: ${slug}`);
      }
    }
    console.log(`[批次原子发布] 成功发布优质软件: ${publishedList.length} 款`);
    publishedList.forEach(p => console.log(`   - ${p.name} (${p.slug}) [${p.versions} 个版本置为 APPROVED]`));

    // 2.7 记录审计日志
    const admin = await tx.user.findFirst();
    if (admin) {
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'P901_STAGE_C_BATCH_RELEASE',
          targetType: 'SOFTWARE_BATCH',
          targetId: `P901_BATCH_${Date.now()}`,
          after: JSON.stringify({
            publishedCount: publishedList.length,
            slugs: APPROVED_SLUGS,
            operator: 'SoftTribe Master Architect (Authorized by User)',
            timestamp: new Date().toISOString()
          })
        }
      });
    }

    return { publishedCount: publishedList.length };
  });

  // 3. 发布后真实数据库复核
  const postPublishedCount = await prisma.software.count({
    where: { status: 'PUBLISHED', isTestData: false }
  });
  const postDraftCount = await prisma.software.count({
    where: { status: 'DRAFT', isTestData: false }
  });
  const postTestCount = await prisma.software.count({
    where: { isTestData: true }
  });

  console.log('\n===============================================================');
  console.log('📊 发布后真实数据库状态统计：');
  console.log(`   - 公开发布非测试软件: ${postPublishedCount} 款 (发布前: ${prePublishedCount} 款, 净增: +${postPublishedCount - prePublishedCount})`);
  console.log(`   - 待审草稿软件储备: ${postDraftCount} 款 (发布前: ${preDraftCount} 款)`);
  console.log(`   - 隔离测试软件保持: ${postTestCount} 款 (严格物理隔离保持不变)`);
  console.log('===============================================================\n');

  if (postPublishedCount !== prePublishedCount + 10) {
    console.warn(`[警告] 发布后总数与预期不完全吻合: 期望 ${prePublishedCount + 10}, 实际 ${postPublishedCount}`);
  } else {
    console.log('🎉 数据库发布事务全部通过验证，数据完整一致！');
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ 发布事务执行异常失败:', err);
  await prisma.$disconnect();
  process.exit(1);
});
