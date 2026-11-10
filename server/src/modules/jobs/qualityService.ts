import { prisma } from '../../db';

export interface QualityEvaluation {
  score: number; // 0-100
  details: {
    hasName: boolean; // 10
    hasDeveloper: boolean; // 10
    hasVerifiedSource: boolean; // 10
    hasCategory: boolean; // 10
    hasVersion: boolean; // 10
    hasPlatform: boolean; // 10
    hasLicense: boolean; // 10
    hasIcon: boolean; // 10
    hasChangelog: boolean; // 10
    hasDetailedDesc: boolean; // 10
  };
  missingFields: string[];
  recommendations: string[];
}

/**
 * 内部资源资料完整度评分体系 (P3-F: 严格仅作为站内运营指标，绝不误导宣传为用户或安全评分)
 */
export async function evaluateSoftwareQuality(softwareId: string): Promise<QualityEvaluation> {
  const software = await prisma.software.findUnique({
    where: { id: softwareId },
    include: {
      category: true,
      versions: {
        include: { downloadSources: true },
        orderBy: { createdAt: 'desc' },
      },
      licenses: true,
      sources: true,
    },
  });

  if (!software) throw new Error('软件不存在');

  const latestVer = software.versions.find((v) => v.isLatest) || software.versions[0];
  const hasDownloadSources = software.versions.some((v) => v.downloadSources.length > 0);
  const hasVerifiedSource = software.sources.some((s) => s.trustStatus === 'VERIFIED') || hasDownloadSources;

  const hasName = Boolean(software.name && software.name.trim().length > 0);
  const hasDeveloper = Boolean(software.developer && software.developer !== '未知开发者');
  const hasCategory = Boolean(software.category && software.category.id);
  const hasVersion = Boolean(latestVer && latestVer.version);
  const hasPlatform = Boolean(latestVer && latestVer.platform && latestVer.platform.length > 0);
  const hasLicense = software.licenses.length > 0 || Boolean(software.licenseType);
  const hasIcon = Boolean(software.iconUrl && software.iconUrl.trim().length > 0);
  const hasChangelog = Boolean(latestVer && latestVer.changelog && latestVer.changelog.length > 5);
  const hasDetailedDesc = Boolean(software.description && software.description.trim().length >= 30);

  const missingFields: string[] = [];
  const recommendations: string[] = [];

  if (!hasDeveloper) {
    missingFields.push('developer');
    recommendations.push('请补充权威官方开发商名称');
  }
  if (!hasVerifiedSource) {
    missingFields.push('verifiedSource');
    recommendations.push('请添加或核实官方官方下载来源');
  }
  if (!hasIcon) {
    missingFields.push('iconUrl');
    recommendations.push('请上传或配置清晰正版官方软件 Logo');
  }
  if (!hasChangelog) {
    missingFields.push('changelog');
    recommendations.push('请补充最新版版本更新日志说明');
  }
  if (!hasDetailedDesc) {
    missingFields.push('description');
    recommendations.push('软件详情正文建议丰富至 30 字以上客观说明');
  }

  const checks = [
    hasName,
    hasDeveloper,
    hasVerifiedSource,
    hasCategory,
    hasVersion,
    hasPlatform,
    hasLicense,
    hasIcon,
    hasChangelog,
    hasDetailedDesc,
  ];

  const score = checks.filter(Boolean).length * 10;

  const details = {
    hasName,
    hasDeveloper,
    hasVerifiedSource,
    hasCategory,
    hasVersion,
    hasPlatform,
    hasLicense,
    hasIcon,
    hasChangelog,
    hasDetailedDesc,
  };

  // 持久化到 ResourceQualityReport
  await prisma.resourceQualityReport.upsert({
    where: { softwareId },
    create: {
      softwareId,
      completenessScore: score,
      details: JSON.stringify(details),
      missingFields: JSON.stringify(missingFields),
      recommendations: JSON.stringify(recommendations),
      evaluatedAt: new Date(),
    },
    update: {
      completenessScore: score,
      details: JSON.stringify(details),
      missingFields: JSON.stringify(missingFields),
      recommendations: JSON.stringify(recommendations),
      evaluatedAt: new Date(),
    },
  });

  return {
    score,
    details,
    missingFields,
    recommendations,
  };
}
