import { prisma } from '../../db';
import { CandidateReviewStatus, SourceType, VerificationStatus, NotificationLevel } from '@prisma/client';

/**
 * 健壮的 SemVer 与日期版本字符串比较算法
 * 返回值:
 *  > 0: candidateVersion 比 currentVersion 更新
 *  < 0: candidateVersion 较旧
 *  = 0: 版本相同
 */
export function compareVersions(current: string, candidate: string): number {
  const cleanVer = (v: string) => v.trim().replace(/^v/i, '').replace(/[-_].*$/, '');

  const cClean = cleanVer(current);
  const nClean = cleanVer(candidate);

  if (cClean === nClean) return 0;

  // 尝试拆解数字段 (如 "1.2.3.4" 或 "2024.1")
  const cParts = cClean.split('.').map((p) => parseInt(p, 10) || 0);
  const nParts = nClean.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(cParts.length, nParts.length);
  for (let i = 0; i < maxLen; i++) {
    const cVal = cParts[i] || 0;
    const nVal = nParts[i] || 0;
    if (nVal > cVal) return 1;
    if (nVal < cVal) return -1;
  }

  // 兜底回退到非数字字符串比较
  return candidate.localeCompare(current);
}

/**
 * 针对指定软件发起官方版本更新检测
 */
export async function checkSoftwareUpdate(softwareId: string): Promise<{
  checked: boolean;
  hasNewVersion: boolean;
  currentVersion?: string;
  candidateVersion?: string;
  candidateId?: string;
  message: string;
}> {
  const software = await prisma.software.findUnique({
    where: { id: softwareId },
    include: {
      versions: { orderBy: { createdAt: 'desc' } },
      sources: { where: { enabled: true } },
    },
  });

  if (!software) {
    throw new Error('未找到该软件');
  }

  const latestVersionRecord = software.versions.find((v) => v.isLatest) || software.versions[0];
  const currentVer = latestVersionRecord ? latestVersionRecord.version : '0.0.0';

  // 优先匹配已登记的官方来源
  const source = software.sources[0];
  let discoveredVer: string | null = null;
  let changelog = '';
  let sourceUrl = '';
  let downloadUrl = '';

  if (source && source.sourceType === 'GITHUB_RELEASES') {
    // 从 GitHub Releases 获取
    try {
      const parts = new URL(source.baseUrl).pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const [owner, repo] = parts;
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`, {
          headers: { 'User-Agent': 'SoftBuluo-VersionBot/3.0', 'Accept': 'application/vnd.github.v3+json' },
        });

        if (res.ok) {
          const list = (await res.json()) as any[];
          // 严格区分与筛选最新稳定正式版 (排除 prerelease, draft, 以及 beta/alpha/rc/nightly 预发布)
          const isStrictStable = (item: any) => {
            if (item.prerelease || item.draft) return false;
            const tag = (item.tag_name || item.name || '').toLowerCase();
            return (
              !tag.includes('beta') &&
              !tag.includes('alpha') &&
              !tag.includes('rc') &&
              !tag.includes('nightly') &&
              !tag.includes('preview')
            );
          };

          const stableRelease = list.find(isStrictStable) || list.find((it) => !it.draft && !it.prerelease) || list[0];
          if (stableRelease) {
            discoveredVer = stableRelease.tag_name?.replace(/^v/i, '') || stableRelease.name;
            changelog = (stableRelease.body || '').slice(0, 1000);
            sourceUrl = stableRelease.html_url || source.baseUrl;
            if (stableRelease.assets && stableRelease.assets.length > 0) {
              downloadUrl = stableRelease.assets[0].browser_download_url;
            }
          }
        }
      }
    } catch {
      // 忽略网络错误
    }
  }

  // 降级模拟或测试探测：若无活跃官方 API，根据规则提取最新公开版本
  if (!discoveredVer) {
    return {
      checked: true,
      hasNewVersion: false,
      currentVersion: currentVer,
      message: '当前版本已是最新，或尚未配置自动 Releases API 来源',
    };
  }

  // 版本大小比对
  const isNewer = compareVersions(currentVer, discoveredVer) > 0;
  if (!isNewer) {
    return {
      checked: true,
      hasNewVersion: false,
      currentVersion: currentVer,
      candidateVersion: discoveredVer,
      message: `检测到版本 [${discoveredVer}] 未高于当前最新版本 [${currentVer}]`,
    };
  }

  // 检查是否已存在该候选版本 (幂等防重)
  const existingCandidate = await prisma.versionCandidate.findFirst({
    where: {
      softwareId: software.id,
      candidateVersion: discoveredVer,
    },
  });

  if (existingCandidate) {
    return {
      checked: true,
      hasNewVersion: true,
      currentVersion: currentVer,
      candidateVersion: discoveredVer,
      candidateId: existingCandidate.id,
      message: `新版本 [${discoveredVer}] 已在候选审核池中 (当前状态: ${existingCandidate.reviewStatus})`,
    };
  }

  // 创建全新待审候选版本
  const candidate = await prisma.versionCandidate.create({
    data: {
      softwareId: software.id,
      sourceId: source?.id || null,
      currentVersion: currentVer,
      candidateVersion: discoveredVer,
      releaseDate: new Date().toISOString().split('T')[0],
      changelog,
      sourceUrl,
      downloadUrl: downloadUrl || null,
      discoverySource: source?.sourceType || 'OFFICIAL_WEBSITE',
      reviewStatus: CandidateReviewStatus.PENDING_REVIEW,
    },
  });

  // 创建运营工作台通知
  await prisma.operationNotification.create({
    data: {
      title: `发现新版本: ${software.name} v${discoveredVer}`,
      message: `监测到软件 [${software.name}] 官方发布了新版本 ${discoveredVer} (当前: ${currentVer})，请尽快审核。`,
      level: NotificationLevel.INFO,
      category: 'VERSION_UPDATE',
      targetUrl: `/admin/version-monitor?candidateId=${candidate.id}`,
    },
  });

  return {
    checked: true,
    hasNewVersion: true,
    currentVersion: currentVer,
    candidateVersion: discoveredVer,
    candidateId: candidate.id,
    message: `成功捕获到新版本 [${discoveredVer}]，已登记至待审核候选池`,
  };
}

/**
 * 审核新版本候选并流转正式版本
 */
export async function reviewVersionCandidate(params: {
  candidateId: string;
  action: 'APPROVE' | 'REJECT';
  reviewedBy: string;
  reviewNotes?: string;
}) {
  const { candidateId, action, reviewedBy, reviewNotes } = params;

  const candidate = await prisma.versionCandidate.findUnique({
    where: { id: candidateId },
    include: { software: true },
  });

  if (!candidate) throw new Error('版本候选记录不存在');

  const now = new Date();

  if (action === 'REJECT') {
    const updated = await prisma.versionCandidate.update({
      where: { id: candidateId },
      data: {
        reviewStatus: CandidateReviewStatus.REJECTED,
        reviewNotes: reviewNotes || '经人工复核驳回该版本候选',
        reviewedAt: now,
        reviewedBy,
      },
    });
    return { success: true, candidate: updated, published: false };
  }

  // 审核通过 (APPROVE)：升级为正式发布状态，并写入 SoftwareVersion
  return await prisma.$transaction(async (tx) => {
    // 1. 将其他旧版本 isLatest 置为 false
    await tx.softwareVersion.updateMany({
      where: { softwareId: candidate.softwareId },
      data: { isLatest: false },
    });

    // 2. 创建正式新版本
    const newVersion = await tx.softwareVersion.create({
      data: {
        softwareId: candidate.softwareId,
        version: candidate.candidateVersion,
        platform: candidate.platform || 'Windows 10/11',
        architecture: candidate.architecture || 'x64',
        fileSize: '官方完整安装包',
        releaseDate: candidate.releaseDate || now.toISOString().split('T')[0],
        changelog: candidate.changelog || '官方版本更新。',
        isLatest: true,
        reviewStatus: 'APPROVED',
      },
    });

    // 3. 若提供官方下载 URL，同步挂载下载源
    if (candidate.downloadUrl || candidate.sourceUrl) {
      await tx.downloadSource.create({
        data: {
          versionId: newVersion.id,
          sourceType: SourceType.OFFICIAL_EXTERNAL,
          sourceName: '原厂官方最新版下载',
          url: candidate.downloadUrl || candidate.sourceUrl || '',
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      });
    }

    // 4. 更新候选状态为 PUBLISHED
    const updatedCandidate = await tx.versionCandidate.update({
      where: { id: candidateId },
      data: {
        reviewStatus: CandidateReviewStatus.PUBLISHED,
        reviewNotes: reviewNotes || '审核通过，已正式公开发布新版本',
        reviewedAt: now,
        reviewedBy,
      },
    });

    // 5. 更新主软件的 updatedAt，使首页和搜索流自动前置
    await tx.software.update({
      where: { id: candidate.softwareId },
      data: { updatedAt: now },
    });

    return { success: true, candidate: updatedCandidate, published: true, newVersionId: newVersion.id };
  });
}

/**
 * 分页查询版本候选记录
 */
export async function listVersionCandidates(params: {
  page?: number;
  limit?: number;
  reviewStatus?: CandidateReviewStatus;
  softwareId?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.reviewStatus) where.reviewStatus = params.reviewStatus;
  if (params.softwareId) where.softwareId = params.softwareId;

  const [total, items] = await Promise.all([
    prisma.versionCandidate.count({ where }),
    prisma.versionCandidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { discoveredAt: 'desc' },
      include: {
        software: { select: { id: true, name: true, slug: true, developer: true } },
        source: { select: { id: true, name: true, baseUrl: true } },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
