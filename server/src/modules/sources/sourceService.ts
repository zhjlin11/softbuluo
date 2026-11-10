import { prisma } from '../../db';
import { SoftwareSourceType, SourceTrustStatus } from '@prisma/client';
import { validateSafeExternalUrl } from '../../utils/security';

export interface CreateSourceInput {
  name: string;
  sourceType: SoftwareSourceType;
  baseUrl: string;
  developerName?: string;
  discoveryMethod?: string;
  apiEndpoint?: string;
  checkInterval?: number;
  rateLimit?: number;
  softwareId?: string;
}

export interface UpdateSourceInput {
  name?: string;
  baseUrl?: string;
  developerName?: string;
  discoveryMethod?: string;
  apiEndpoint?: string;
  enabled?: boolean;
  trustStatus?: SourceTrustStatus;
  checkInterval?: number;
  rateLimit?: number;
  softwareId?: string;
}

/**
 * 创建官方资源来源
 */
export async function createSoftwareSource(input: CreateSourceInput) {
  // 1. SSRF 严格安全校验
  const safeCheck = await validateSafeExternalUrl(input.baseUrl);
  if (!safeCheck.valid || !safeCheck.urlObj) {
    throw new Error(`来源 URL 安全校验失败: ${safeCheck.reason || '非法地址'}`);
  }

  const officialDomain = safeCheck.urlObj.hostname.toLowerCase();

  // 若为 GITHUB_RELEASES 或 GITLAB_RELEASES，核验仓库路径格式
  if (
    input.sourceType === SoftwareSourceType.GITHUB_RELEASES &&
    !officialDomain.includes('github.com')
  ) {
    throw new Error('GITHUB_RELEASES 来源类型必须对应 github.com 域名');
  }

  if (
    input.sourceType === SoftwareSourceType.GITLAB_RELEASES &&
    !officialDomain.includes('gitlab.com')
  ) {
    throw new Error('GITLAB_RELEASES 来源类型必须对应 gitlab.com 域名');
  }

  return await prisma.softwareSource.create({
    data: {
      name: input.name,
      sourceType: input.sourceType,
      baseUrl: input.baseUrl,
      officialDomain,
      developerName: input.developerName || null,
      discoveryMethod: input.discoveryMethod || 'API_CRAWLER',
      apiEndpoint: input.apiEndpoint || null,
      checkInterval: input.checkInterval || 86400,
      rateLimit: input.rateLimit || 60,
      softwareId: input.softwareId || null,
      trustStatus: SourceTrustStatus.PENDING,
      enabled: true,
    },
  });
}

/**
 * 更新官方资源来源
 */
export async function updateSoftwareSource(id: string, input: UpdateSourceInput) {
  const existing = await prisma.softwareSource.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('资源来源不存在');
  }

  let officialDomain = existing.officialDomain;
  if (input.baseUrl && input.baseUrl !== existing.baseUrl) {
    const safeCheck = await validateSafeExternalUrl(input.baseUrl);
    if (!safeCheck.valid || !safeCheck.urlObj) {
      throw new Error(`新来源 URL 安全校验失败: ${safeCheck.reason || '非法地址'}`);
    }
    officialDomain = safeCheck.urlObj.hostname.toLowerCase();
  }

  return await prisma.softwareSource.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.baseUrl && { baseUrl: input.baseUrl, officialDomain }),
      ...(input.developerName !== undefined && { developerName: input.developerName }),
      ...(input.discoveryMethod && { discoveryMethod: input.discoveryMethod }),
      ...(input.apiEndpoint !== undefined && { apiEndpoint: input.apiEndpoint }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
      ...(input.trustStatus && { trustStatus: input.trustStatus }),
      ...(input.checkInterval !== undefined && { checkInterval: input.checkInterval }),
      ...(input.rateLimit !== undefined && { rateLimit: input.rateLimit }),
      ...(input.softwareId !== undefined && { softwareId: input.softwareId }),
    },
  });
}

/**
 * 验证官方来源连通性与合法性
 */
export async function verifySoftwareSource(id: string): Promise<{
  success: boolean;
  httpStatus: number;
  message: string;
  source: any;
}> {
  const source = await prisma.softwareSource.findUnique({ where: { id } });
  if (!source) {
    throw new Error('资源来源不存在');
  }

  const safeCheck = await validateSafeExternalUrl(source.baseUrl);
  if (!safeCheck.valid) {
    const updated = await prisma.softwareSource.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastError: safeCheck.reason || 'SSRF 安全拦截',
        trustStatus: SourceTrustStatus.REJECTED,
      },
    });
    return { success: false, httpStatus: 403, message: safeCheck.reason || 'SSRF 拦截', source: updated };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s 超时

    const res = await fetch(source.baseUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SoftBuluo-SourceBot/3.0 (+https://softbuluo.com/bot; bot@softbuluo.com)',
        'Accept': 'text/html,application/xhtml+xml,application/json,*/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const now = new Date();
    const isSuccess = res.status >= 200 && res.status < 400;

    const updated = await prisma.softwareSource.update({
      where: { id },
      data: {
        lastCheckedAt: now,
        ...(isSuccess
          ? {
              lastSuccessAt: now,
              lastError: null,
              trustStatus: SourceTrustStatus.VERIFIED,
            }
          : {
              lastError: `HTTP ${res.status}: ${res.statusText}`,
              trustStatus: SourceTrustStatus.REJECTED,
            }),
      },
    });

    return {
      success: isSuccess,
      httpStatus: res.status,
      message: isSuccess ? '来源连通性核验通过' : `响应状态异常: ${res.status}`,
      source: updated,
    };
  } catch (err: any) {
    const updated = await prisma.softwareSource.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastError: err.message || '网络通讯超时或连接重置',
        trustStatus: SourceTrustStatus.REJECTED,
      },
    });
    return {
      success: false,
      httpStatus: 0,
      message: err.message || '检测失败',
      source: updated,
    };
  }
}

/**
 * 分页查询来源列表
 */
export async function listSoftwareSources(params: {
  page?: number;
  limit?: number;
  trustStatus?: SourceTrustStatus;
  sourceType?: SoftwareSourceType;
  q?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.trustStatus) where.trustStatus = params.trustStatus;
  if (params.sourceType) where.sourceType = params.sourceType;
  if (params.q && params.q.trim()) {
    where.OR = [
      { name: { contains: params.q.trim(), mode: 'insensitive' } },
      { officialDomain: { contains: params.q.trim(), mode: 'insensitive' } },
      { developerName: { contains: params.q.trim(), mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.softwareSource.count({ where }),
    prisma.softwareSource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        software: { select: { id: true, name: true, slug: true } },
        _count: { select: { versionCandidates: true } },
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
