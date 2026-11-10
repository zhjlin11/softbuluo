import { prisma } from '../../db';
import { DataIntegrityStatus, ResourceStatus } from '@prisma/client';

export interface GovernanceMetrics {
  totalResources: number;
  publishedCount: number;
  draftCount: number;
  verifiedCompleteCount: number;
  verifiedIncompleteCount: number;
  needsReviewCount: number;
  sourceUnavailableCount: number;
  duplicateCandidateCount: number;
  unverifiedCount: number;
  completenessRate: number; // 0 - 100
  sourceVerificationRate: number; // 0 - 100
  linkHealthRate: number; // 0 - 100
  pendingAuditCount: number;
  anomalyCount: number;
  lastAuditedAt: Date;
  // P6 生态扩展指标
  developerCount?: number;
  pendingClaimsCount?: number;
  activeThreadsCount?: number;
  pendingReportsCount?: number;
  apiCallsCount?: number;
  activeApiKeysCount?: number;
}

export interface ResourceAuditResult {
  id: string;
  name: string;
  slug: string;
  status: ResourceStatus;
  dataIntegrityStatus: DataIntegrityStatus;
  officialDomainVerified: boolean;
  hasOfficialWebsite: boolean;
  hasDownloadSource: boolean;
  hasLicense: boolean;
  hasIcon: boolean;
  isTestData: boolean;
  issues: string[];
  auditNotes: string;
}

/**
 * P5-1 资源数据完整性与真实性治理服务
 */
export class GovernanceService {
  /**
   * 逐条审计单个软件资源并更新其数据治理状态
   */
  async auditResource(softwareId: string): Promise<ResourceAuditResult> {
    const sw = await prisma.software.findUnique({
      where: { id: softwareId },
      include: {
        sources: true,
        versions: {
          include: {
            downloadSources: {
              include: {
                file: {
                  include: {
                    signatureVerification: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sw) {
      throw new Error(`Resource with id ${softwareId} not found`);
    }

    const issues: string[] = [];
    const isTest = sw.isTestData || sw.slug.startsWith('test-') || sw.name.startsWith('软游测试') || sw.name.startsWith('测试');

    if (isTest) {
      issues.push('标记为测试数据资源，需隔离');
    }

    const hasOfficialWebsite = !!(sw.officialWebsite && sw.officialWebsite.startsWith('http'));
    if (!hasOfficialWebsite) {
      issues.push('缺少官方网站或官方域名');
    }

    const hasLicense = !!(sw.licenseType && sw.licenseType.trim() !== '');
    if (!hasLicense) {
      issues.push('缺少软件许可证协议');
    }

    const hasIcon = !!(sw.iconUrl && sw.iconUrl.trim() !== '');
    if (!hasIcon) {
      issues.push('缺少软件官方图标/Logo');
    }

    const allDownloadSources = sw.versions.flatMap((v) => v.downloadSources);
    const hasDownloadSource = allDownloadSources.length > 0;
    if (!hasDownloadSource) {
      issues.push('无任何可用下载来源或发布渠道');
    }

    const hasBrokenSource = allDownloadSources.some(
      (ds) => ds.lastHttpStatus && ds.lastHttpStatus >= 400 && ds.lastHttpStatus !== 403
    );
    if (hasBrokenSource) {
      issues.push('存在 HTTP 4xx/5xx 下载源错误');
    }

    const officialDomainVerified =
      hasOfficialWebsite &&
      (sw.sources.some((s) => s.trustStatus === 'VERIFIED') ||
        ['microsoft.com', 'google.com', '7-zip.org', 'voidtools.com', 'wireshark.org', 'cpuid.com', 'hwinfo.com', 'crystalmark.info', 'videolan.org', 'github.com', 'libreoffice.org', 'gimp.org', 'obsproject.com', 'blender.org', 'putty.org'].some((d) =>
          sw.officialWebsite?.includes(d)
        ));

    // 计算内部数据完整性状态
    let integrityStatus: DataIntegrityStatus = DataIntegrityStatus.UNVERIFIED;

    if (isTest) {
      integrityStatus = DataIntegrityStatus.NEEDS_REVIEW;
    } else if (hasBrokenSource || (!hasDownloadSource && sw.status === 'PUBLISHED')) {
      integrityStatus = DataIntegrityStatus.SOURCE_UNAVAILABLE;
    } else if (hasOfficialWebsite && officialDomainVerified && hasDownloadSource && hasLicense && hasIcon) {
      integrityStatus = DataIntegrityStatus.VERIFIED_COMPLETE;
    } else if (hasOfficialWebsite && hasDownloadSource) {
      integrityStatus = DataIntegrityStatus.VERIFIED_INCOMPLETE;
    } else {
      integrityStatus = DataIntegrityStatus.NEEDS_REVIEW;
    }

    const auditNotes = issues.length > 0 ? issues.join('; ') : '资料要素齐全，官方来源有效';

    // 更新到数据库
    await prisma.software.update({
      where: { id: sw.id },
      data: {
        dataIntegrityStatus: integrityStatus,
        officialDomainVerified,
        isTestData: isTest,
        lastAuditedAt: new Date(),
        auditNotes,
      },
    });

    return {
      id: sw.id,
      name: sw.name,
      slug: sw.slug,
      status: sw.status,
      dataIntegrityStatus: integrityStatus,
      officialDomainVerified,
      hasOfficialWebsite,
      hasDownloadSource,
      hasLicense,
      hasIcon,
      isTestData: isTest,
      issues,
      auditNotes,
    };
  }

  /**
   * 全量审计现有资源库并输出指标
   */
  async auditAllResources(): Promise<GovernanceMetrics> {
    const allSoftware = await prisma.software.findMany({ select: { id: true } });

    for (const item of allSoftware) {
      await this.auditResource(item.id);
    }

    return this.getGovernanceMetrics();
  }

  /**
   * 获取最新真实数据库数据治理指标
   */
  async getGovernanceMetrics(): Promise<GovernanceMetrics> {
    const officialWhere = { isTestData: false };
    const totalResources = await prisma.software.count({ where: officialWhere });
    const publishedCount = await prisma.software.count({ where: { ...officialWhere, status: 'PUBLISHED' } });
    const draftCount = await prisma.software.count({ where: { ...officialWhere, status: 'DRAFT' } });

    const verifiedCompleteCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.VERIFIED_COMPLETE },
    });
    const verifiedIncompleteCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.VERIFIED_INCOMPLETE },
    });
    const needsReviewCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.NEEDS_REVIEW },
    });
    const sourceUnavailableCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.SOURCE_UNAVAILABLE },
    });
    const duplicateCandidateCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.DUPLICATE_CANDIDATE },
    });
    const unverifiedCount = await prisma.software.count({
      where: { ...officialWhere, dataIntegrityStatus: DataIntegrityStatus.UNVERIFIED },
    });

    // 来源核验率
    const totalSources = await prisma.softwareSource.count();
    const verifiedSources = await prisma.softwareSource.count({ where: { trustStatus: 'VERIFIED' } });
    const sourceVerificationRate = totalSources > 0 ? Math.round((verifiedSources / totalSources) * 100) : 100;

    // 下载链接有效率
    const totalDownloadSources = await prisma.downloadSource.count();
    const brokenSources = await prisma.downloadSource.count({
      where: { lastHttpStatus: { gte: 400 } },
    });
    const linkHealthRate =
      totalDownloadSources > 0
        ? Math.round(((totalDownloadSources - brokenSources) / totalDownloadSources) * 100)
        : 100;

    const completenessRate =
      totalResources > 0 ? Math.round((verifiedCompleteCount / totalResources) * 100) : 0;

    const pendingAuditCount = needsReviewCount + unverifiedCount;
    const anomalyCount = sourceUnavailableCount + brokenSources;

    // P6 生态扩展指标统计
    const [developerCount, pendingClaimsCount, activeThreadsCount, pendingReportsCount, apiCallsCount, activeApiKeysCount] =
      await Promise.all([
        prisma.developerProfile.count(),
        prisma.softwareClaim.count({ where: { status: 'PENDING' } }),
        prisma.discussionThread.count({ where: { status: 'ACTIVE' } }),
        prisma.discussionReport.count({ where: { status: 'PENDING' } }),
        prisma.apiUsageRecord.count(),
        prisma.developerApiKey.count({ where: { status: 'ACTIVE' } }),
      ]);

    return {
      totalResources,
      publishedCount,
      draftCount,
      verifiedCompleteCount,
      verifiedIncompleteCount,
      needsReviewCount,
      sourceUnavailableCount,
      duplicateCandidateCount,
      unverifiedCount,
      completenessRate,
      sourceVerificationRate,
      linkHealthRate,
      pendingAuditCount,
      anomalyCount,
      lastAuditedAt: new Date(),
      developerCount,
      pendingClaimsCount,
      activeThreadsCount,
      pendingReportsCount,
      apiCallsCount,
      activeApiKeysCount,
    };
  }

  /**
   * 获取异常或待审资源清单供管理员复核
   */
  async getAuditQueue(options?: {
    status?: DataIntegrityStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;

    const where: any = {};
    if (options?.status) {
      where.dataIntegrityStatus = options.status;
    } else {
      where.dataIntegrityStatus = {
        in: [
          DataIntegrityStatus.NEEDS_REVIEW,
          DataIntegrityStatus.UNVERIFIED,
          DataIntegrityStatus.SOURCE_UNAVAILABLE,
          DataIntegrityStatus.DUPLICATE_CANDIDATE,
          DataIntegrityStatus.VERIFIED_INCOMPLETE,
        ],
      };
    }

    const total = await prisma.software.count({ where });
    const items = await prisma.software.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        developer: true,
        officialWebsite: true,
        licenseType: true,
        status: true,
        dataIntegrityStatus: true,
        officialDomainVerified: true,
        isTestData: true,
        auditNotes: true,
        lastAuditedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            versions: true,
            sources: true,
          },
        },
      },
    });

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

export const governanceService = new GovernanceService();
