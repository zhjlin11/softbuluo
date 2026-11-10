import { prisma } from '../../db';
import { ApiKeyStatus, ApiKeyTier, ResourceStatus, ResourceType } from '@prisma/client';
import crypto from 'crypto';

export class OpenApiService {
  /**
   * 生成新的开发者 API Key
   * 仅在创建时返回一次明文 rawKey
   */
  static async generateApiKey(developerId: string, name: string, tier: ApiKeyTier = ApiKeyTier.TIER_DEVELOPER) {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const fullKey = `sb_live_${rawSecret}`;
    const keyPrefix = fullKey.slice(0, 15);
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const record = await prisma.developerApiKey.create({
      data: {
        developerId,
        name: name.trim() || 'Default API Key',
        keyPrefix,
        keyHash,
        rateLimitTier: tier,
        status: ApiKeyStatus.ACTIVE
      }
    });

    return {
      id: record.id,
      name: record.name,
      apiKey: fullKey, // 仅展示一次
      keyPrefix: record.keyPrefix,
      rateLimitTier: record.rateLimitTier,
      createdAt: record.createdAt,
      notice: '请妥善保管此密钥，关闭后将无法再次查看完整密钥！'
    };
  }

  /**
   * 撤销 API Key
   */
  static async revokeApiKey(keyId: string, developerId: string) {
    return prisma.developerApiKey.updateMany({
      where: { id: keyId, developerId },
      data: { status: ApiKeyStatus.REVOKED }
    });
  }

  /**
   * 校验 API Key 凭据
   */
  static async validateApiKey(key: string) {
    if (!key || !key.startsWith('sb_live_')) return null;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    const keyRecord = await prisma.developerApiKey.findUnique({
      where: { keyHash },
      include: { developer: true }
    });

    if (!keyRecord || keyRecord.status !== ApiKeyStatus.ACTIVE) {
      return null;
    }

    // 更新最后调用时间 (异步更新不阻塞)
    prisma.developerApiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    return keyRecord;
  }

  /**
   * 记录 API 调用日志
   */
  static async logUsage(params: {
    keyId?: string;
    ip: string;
    endpoint: string;
    method?: string;
    statusCode: number;
    responseTimeMs: number;
  }) {
    try {
      await prisma.apiUsageRecord.create({
        data: {
          keyId: params.keyId || null,
          ip: params.ip,
          endpoint: params.endpoint,
          method: params.method || 'GET',
          statusCode: params.statusCode,
          responseTimeMs: params.responseTimeMs
        }
      });
    } catch (err) {
      // 容错处理
    }
  }

  /**
   * 获取公开软件列表 (仅限已发布、非测试数据)
   */
  static async getPublicSoftwareList(params: {
    categorySlug?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
      type: ResourceType.SOFTWARE
    };

    if (params.categorySlug) {
      where.category = { slug: params.categorySlug };
    }

    const [total, items] = await Promise.all([
      prisma.software.count({ where }),
      prisma.software.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          englishName: true,
          developer: true,
          summary: true,
          iconUrl: true,
          priceType: true,
          licenseType: true,
          officialWebsite: true,
          publishedAt: true,
          category: {
            select: { name: true, slug: true }
          },
          versions: {
            where: { isLatest: true },
            take: 1,
            select: {
              version: true,
              releaseDate: true,
              platform: true,
              fileSize: true
            }
          }
        }
      })
    ]);

    return {
      items: items.map(item => ({
        ...item,
        latestVersion: item.versions[0] || null,
        versions: undefined
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 获取指定软件公开详情
   */
  static async getPublicSoftwareDetail(slug: string) {
    const item = await prisma.software.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            version: true,
            releaseDate: true,
            platform: true,
            fileSize: true,
            changelog: true,
            isLatest: true
          }
        },
        claims: {
          where: { status: 'VERIFIED' },
          include: {
            developer: {
              select: { displayName: true, slug: true, website: true, organizationName: true }
            }
          }
        }
      }
    });

    if (!item || item.status !== ResourceStatus.PUBLISHED || item.isTestData) {
      return null;
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      englishName: item.englishName,
      developer: item.developer,
      summary: item.summary,
      description: item.description,
      iconUrl: item.iconUrl,
      officialWebsite: item.officialWebsite,
      priceType: item.priceType,
      licenseType: item.licenseType,
      publishedAt: item.publishedAt,
      category: item.category,
      verifiedDeveloper: item.claims[0]?.developer || null,
      versions: item.versions
    };
  }

  /**
   * 公开游戏专区接口
   */
  static async getPublicGamesList(params: { page?: number; pageSize?: number }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where = {
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
      type: ResourceType.GAME
    };

    const [total, items] = await Promise.all([
      prisma.software.count({ where }),
      prisma.software.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          developer: true,
          genre: true,
          publisher: true,
          coverUrl: true,
          distributionPlatform: true,
          priceType: true,
          licenseType: true,
          summary: true
        }
      })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 公开全站分类
   */
  static async getPublicCategories() {
    return prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        _count: {
          select: {
            softwares: { where: { status: ResourceStatus.PUBLISHED, isTestData: false } }
          }
        }
      }
    });
  }

  /**
   * 公开软件搜索
   */
  static async searchPublicSoftware(query: string) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();

    return prisma.software.findMany({
      where: {
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
          { englishName: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 15,
      select: {
        id: true,
        name: true,
        slug: true,
        developer: true,
        summary: true,
        iconUrl: true,
        licenseType: true,
        category: { select: { name: true, slug: true } }
      }
    });
  }
}
