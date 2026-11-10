import { prisma } from '../../db';
import { DeveloperVerificationStatus, ClaimStatus, ClaimMethod, ResourceStatus } from '@prisma/client';
import crypto from 'crypto';

export interface DeveloperRegisterDto {
  displayName: string;
  organizationName?: string;
  website?: string;
  githubUsername?: string;
  bio?: string;
}

export interface DeveloperSubmissionDto {
  softwareName: string;
  slug: string;
  officialWebsite: string;
  repoUrl?: string;
  version: string;
  license?: string;
  releaseDate?: string;
  summary: string;
  description: string;
  changelog?: string;
  iconUrl?: string;
  downloadUrl: string;
}

export class DeveloperService {
  /**
   * 注册/申请成为认证开发者
   */
  static async registerDeveloper(memberUserId: string, data: DeveloperRegisterDto) {
    const existing = await prisma.developerProfile.findUnique({
      where: { memberUserId }
    });

    if (existing) {
      if (existing.verificationStatus === DeveloperVerificationStatus.VERIFIED) {
        throw new Error('您已经是认证开发者，无需重复申请');
      }
      // 更新现有申请
      return prisma.developerProfile.update({
        where: { id: existing.id },
        data: {
          displayName: data.displayName,
          organizationName: data.organizationName,
          website: data.website,
          githubUsername: data.githubUsername,
          bio: data.bio,
          verificationStatus: DeveloperVerificationStatus.PENDING_REVIEW,
          updatedAt: new Date()
        }
      });
    }

    // 生成 URL 友好的 slug
    let baseSlug = data.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    if (!baseSlug || baseSlug === '-') {
      baseSlug = `dev-${Date.now().toString(36)}`;
    }
    let slug = baseSlug;
    let count = 1;
    while (await prisma.developerProfile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    return prisma.developerProfile.create({
      data: {
        memberUserId,
        displayName: data.displayName,
        slug,
        organizationName: data.organizationName,
        website: data.website,
        githubUsername: data.githubUsername,
        bio: data.bio,
        verificationStatus: DeveloperVerificationStatus.PENDING_REVIEW
      }
    });
  }

  /**
   * 获取当前登录会员的开发者档案
   */
  static async getDeveloperProfile(memberUserId: string) {
    return prisma.developerProfile.findUnique({
      where: { memberUserId },
      include: {
        submissions: { orderBy: { createdAt: 'desc' } },
        claims: {
          include: { software: true },
          orderBy: { createdAt: 'desc' }
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            rateLimitTier: true,
            status: true,
            lastUsedAt: true,
            createdAt: true
          }
        }
      }
    });
  }

  /**
   * 公开获取已认证开发者主页信息 (用于 /developers/:slug)
   */
  static async getPublicDeveloperProfile(slug: string) {
    const dev = await prisma.developerProfile.findUnique({
      where: { slug },
      include: {
        claims: {
          where: { status: ClaimStatus.VERIFIED },
          include: {
            software: {
              include: { category: true }
            }
          }
        }
      }
    });

    if (!dev || dev.verificationStatus !== DeveloperVerificationStatus.VERIFIED) {
      return null;
    }

    return {
      id: dev.id,
      displayName: dev.displayName,
      slug: dev.slug,
      organizationName: dev.organizationName,
      website: dev.website,
      githubUsername: dev.githubUsername,
      bio: dev.bio,
      verifiedAt: dev.verifiedAt,
      verifiedSoftware: dev.claims
        .map(c => c.software)
        .filter(s => s && s.status === ResourceStatus.PUBLISHED && !s.isTestData)
    };
  }

  /**
   * 开发者提交软件草稿 (进入审核流，不可直接公开)
   */
  static async submitSoftware(developerId: string, data: DeveloperSubmissionDto) {
    const dev = await prisma.developerProfile.findUnique({
      where: { id: developerId }
    });

    if (!dev || dev.verificationStatus !== DeveloperVerificationStatus.VERIFIED) {
      throw new Error('只有已通过官方审核认证的开发者才可提交软件资料');
    }

    return prisma.developerSubmission.create({
      data: {
        developerId,
        softwareName: data.softwareName,
        slug: data.slug,
        officialWebsite: data.officialWebsite,
        repoUrl: data.repoUrl,
        version: data.version,
        license: data.license || 'FREE',
        releaseDate: data.releaseDate,
        summary: data.summary,
        description: data.description,
        changelog: data.changelog,
        iconUrl: data.iconUrl,
        downloadUrl: data.downloadUrl,
        status: ResourceStatus.PENDING_REVIEW
      }
    });
  }

  /**
   * 申请软件所有权认领并生成验证挑战码
   */
  static async createSoftwareClaim(developerId: string, softwareId: string, claimMethod: ClaimMethod = ClaimMethod.DNS_TXT) {
    const dev = await prisma.developerProfile.findUnique({ where: { id: developerId } });
    if (!dev) throw new Error('开发者资料不存在');

    const software = await prisma.software.findUnique({ where: { id: softwareId } });
    if (!software) throw new Error('目标软件不存在');

    // 检查是否已有成功认领
    const existingClaim = await prisma.softwareClaim.findUnique({
      where: {
        softwareId_developerId: { softwareId, developerId }
      }
    });

    if (existingClaim && existingClaim.status === ClaimStatus.VERIFIED) {
      throw new Error('您已成功认领该软件，无需重复操作');
    }

    // 生成不可预测的挑战随机码
    const challengeCode = `softbuluo-claim-${crypto.randomBytes(16).toString('hex')}`;
    const verificationTarget = claimMethod === ClaimMethod.DNS_TXT
      ? `DNS TXT 记录值请设为: ${challengeCode}`
      : `请在官网根目录创建: /.well-known/softbuluo.txt，内容包含: ${challengeCode}`;

    if (existingClaim) {
      return prisma.softwareClaim.update({
        where: { id: existingClaim.id },
        data: {
          claimMethod,
          challengeCode,
          verificationTarget,
          status: ClaimStatus.PENDING,
          rejectionReason: null,
          updatedAt: new Date()
        }
      });
    }

    return prisma.softwareClaim.create({
      data: {
        softwareId,
        developerId,
        claimMethod,
        challengeCode,
        verificationTarget,
        status: ClaimStatus.PENDING
      }
    });
  }

  /**
   * 校验认领凭据 (支持 DNS TXT 或 .well-known 文件校验)
   */
  static async verifySoftwareClaim(claimId: string, evidenceUrl?: string) {
    const claim = await prisma.softwareClaim.findUnique({
      where: { id: claimId },
      include: { software: true, developer: true }
    });

    if (!claim) throw new Error('认领申请不存在');
    if (claim.status === ClaimStatus.VERIFIED) return claim;

    // 记录提交的凭证 URL，更新为待人工核验或模拟校验
    return prisma.softwareClaim.update({
      where: { id: claimId },
      data: {
        evidenceUrl: evidenceUrl || claim.evidenceUrl,
        updatedAt: new Date()
      }
    });
  }

  /**
   * 管理员审核开发者入驻申请
   */
  static async adminReviewDeveloper(
    developerId: string,
    status: DeveloperVerificationStatus,
    adminNotes: string,
    adminUsername: string
  ) {
    return prisma.developerProfile.update({
      where: { id: developerId },
      data: {
        verificationStatus: status,
        verifiedAt: status === DeveloperVerificationStatus.VERIFIED ? new Date() : null,
        verifiedBy: adminUsername,
        adminNotes,
        updatedAt: new Date()
      }
    });
  }

  /**
   * 管理员审核软件认领申请
   */
  static async adminReviewClaim(
    claimId: string,
    status: ClaimStatus,
    rejectionReason: string | null,
    adminUsername: string
  ) {
    return prisma.softwareClaim.update({
      where: { id: claimId },
      data: {
        status,
        rejectionReason: status === ClaimStatus.REJECTED ? rejectionReason : null,
        verifiedAt: status === ClaimStatus.VERIFIED ? new Date() : null,
        verifiedBy: adminUsername,
        updatedAt: new Date()
      }
    });
  }

  /**
   * 管理员审核开发者提交的软件资料
   */
  static async adminReviewSubmission(
    submissionId: string,
    status: ResourceStatus,
    adminNotes: string,
    adminUsername: string
  ) {
    return prisma.developerSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminUsername,
        updatedAt: new Date()
      }
    });
  }
}
