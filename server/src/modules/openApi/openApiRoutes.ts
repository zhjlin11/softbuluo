import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { OpenApiService } from './openApiService';
import { requireMemberAuth, requireRole } from '../../middleware/auth';
import { Role, ApiKeyTier } from '@prisma/client';
import { prisma } from '../../db';

// 简单内存滑动窗口限流器
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxLimit: number): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60 * 1000 });
    return { allowed: true, remaining: maxLimit - 1, resetInSec: 60 };
  }

  if (entry.count >= maxLimit) {
    const resetInSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSec };
  }

  entry.count += 1;
  const resetInSec = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: true, remaining: maxLimit - entry.count, resetInSec };
}

export async function openApiRoutes(server: FastifyInstance) {
  /**
   * ==========================================
   * 公开 API 统一中间件与限流拦截
   * ==========================================
   */
  server.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    // 仅针对 /api/public/v1/ 路由进行公网限流与鉴权打点
    if (!req.url.startsWith('/api/public/v1/')) return;

    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    let limit = 60; // 匿名默认 60 次/分钟
    let rateKey = `ip:${ip}`;
    let authenticatedKeyRecord: any = null;

    if (apiKeyHeader) {
      authenticatedKeyRecord = await OpenApiService.validateApiKey(apiKeyHeader);
      if (!authenticatedKeyRecord) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED_API_KEY', message: '提供的 API Key 无效、已撤销或已过期' }
        });
      }
      limit = authenticatedKeyRecord.rateLimitTier === ApiKeyTier.TIER_DEVELOPER ? 300 : 120;
      rateKey = `key:${authenticatedKeyRecord.id}`;
      (req as any).apiKeyRecord = authenticatedKeyRecord;
    }

    const { allowed, remaining, resetInSec } = checkRateLimit(rateKey, limit);
    reply.header('X-RateLimit-Limit', limit.toString());
    reply.header('X-RateLimit-Remaining', remaining.toString());
    reply.header('X-RateLimit-Reset', resetInSec.toString());

    if (!allowed) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `请求频率超出限制 (限额: ${limit}次/分钟)，请于 ${resetInSec} 秒后再试`
        }
      });
    }

    (req as any).apiStartTime = Date.now();
  });

  server.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.url.startsWith('/api/public/v1/')) return;
    const startTime = (req as any).apiStartTime || Date.now();
    const duration = Date.now() - startTime;
    const keyRecord = (req as any).apiKeyRecord;

    OpenApiService.logUsage({
      keyId: keyRecord?.id,
      ip: req.ip || '127.0.0.1',
      endpoint: req.url.split('?')[0],
      method: req.method,
      statusCode: reply.statusCode,
      responseTimeMs: duration
    }).catch(() => {});
  });

  /**
   * ==========================================
   * 公开只读 API 端点
   * ==========================================
   */

  // 1. 公开软件列表
  server.get('/api/public/v1/software', async (req, reply) => {
    const query = req.query as any;
    const result = await OpenApiService.getPublicSoftwareList({
      categorySlug: query.category,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20
    });
    return reply.send({ success: true, data: result.items, pagination: result.pagination });
  });

  // 2. 公开软件详情
  server.get('/api/public/v1/software/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const detail = await OpenApiService.getPublicSoftwareDetail(slug);
    if (!detail) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '软件不存在或未对外公开' }
      });
    }
    return reply.send({ success: true, data: detail });
  });

  // 3. 公开游戏专区
  server.get('/api/public/v1/games', async (req, reply) => {
    const query = req.query as any;
    const result = await OpenApiService.getPublicGamesList({
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20
    });
    return reply.send({ success: true, data: result.items, pagination: result.pagination });
  });

  // 4. 公开分类清单
  server.get('/api/public/v1/categories', async (req, reply) => {
    const categories = await OpenApiService.getPublicCategories();
    return reply.send({ success: true, data: categories });
  });

  // 5. 公开软件搜索
  server.get('/api/public/v1/search', async (req, reply) => {
    const { q } = req.query as { q?: string };
    const results = await OpenApiService.searchPublicSoftware(q || '');
    return reply.send({ success: true, data: results });
  });

  // 6. 公开版本历史
  server.get('/api/public/v1/versions/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const software = await prisma.software.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          select: {
            version: true,
            releaseDate: true,
            platform: true,
            fileSize: true,
            changelog: true,
            isLatest: true
          }
        }
      }
    });

    if (!software || software.status !== 'PUBLISHED' || software.isTestData) {
      return reply.status(404).send({ success: false, error: { message: '资源不存在' } });
    }

    return reply.send({ success: true, data: software.versions });
  });

  // 7. 公开软件横向对比
  server.get('/api/public/v1/compare/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const comparison = await prisma.softwareComparison.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            software: {
              select: { id: true, name: true, slug: true, iconUrl: true, developer: true }
            }
          }
        },
        attributes: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            attributeName: true,
            category: true,
            valuesJson: true,
            isHighlighted: true,
            sortOrder: true,
            evidenceStatus: true,
            sourceUrl: true,
            testEnvironment: true,
            measuredAt: true
          }
        }
      }
    });

    if (!comparison || comparison.status !== 'PUBLISHED') {
      return reply.status(404).send({ success: false, error: { message: '对比评测不存在' } });
    }

    return reply.send({ success: true, data: comparison });
  });

  /**
   * ==========================================
   * 开发者中心 API Key 自助管理接口 (需登录)
   * ==========================================
   */

  // 获取我拥有的 API Key 列表
  server.get('/api/v1/developer/api-keys', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const devProfile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });

    if (!devProfile) {
      return reply.send({ success: true, data: [] });
    }

    const keys = await prisma.developerApiKey.findMany({
      where: { developerId: devProfile.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        rateLimitTier: true,
        status: true,
        lastUsedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ success: true, data: keys });
  });

  // 创建新的 API Key
  server.post('/api/v1/developer/api-keys', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { name } = req.body as any;

    let devProfile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });
    if (!devProfile) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_PROFILE', message: '请先申请开发者资料后再创建 API Key' }
      });
    }

    try {
      const result = await OpenApiService.generateApiKey(devProfile.id, name || '生产集成密钥');
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 撤销指定 API Key
  server.post('/api/v1/developer/api-keys/:id/revoke', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { id } = req.params as { id: string };

    const devProfile = await prisma.developerProfile.findUnique({ where: { memberUserId: memberId } });
    if (!devProfile) {
      return reply.status(400).send({ success: false, error: { message: '无权限操作' } });
    }

    await OpenApiService.revokeApiKey(id, devProfile.id);
    return reply.send({ success: true, message: 'API Key 已成功撤销' });
  });

  /**
   * ==========================================
   * 管理员后台 API 用量与监控
   * ==========================================
   */
  server.get(
    '/api/v1/admin/api-keys/usage',
    { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const totalCalls = await prisma.apiUsageRecord.count();
      const recentCalls = await prisma.apiUsageRecord.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' }
      });
      const activeKeysCount = await prisma.developerApiKey.count({ where: { status: 'ACTIVE' } });

      return reply.send({
        success: true,
        data: {
          totalCalls,
          activeKeysCount,
          recentCalls
        }
      });
    }
  );

  // OpenAPI 3.0.3 规范 JSON 输出
  const openApiSpecHandler = async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      openapi: '3.0.3',
      info: {
        title: '软游部落开放平台 API (SoftBuluo Open API)',
        version: '1.0.0',
        description: '软游部落为广大开发者与生态伙伴提供的只读公开软件资源、分类检索与版本检测规范。'
      },
      servers: [
        { url: '/api/public/v1', description: '公开只读生产/测试端点' }
      ],
      paths: {
        '/software': {
          get: {
            summary: '获取已收录公开软件列表',
            parameters: [
              { name: 'category', in: 'query', schema: { type: 'string' } },
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } }
            ],
            responses: { 200: { description: '成功返回软件列表与分页' } }
          }
        },
        '/software/{slug}': {
          get: {
            summary: '获取单个软件详情与版本信息',
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: '成功返回软件元数据' }, 404: { description: '软件未找到' } }
          }
        },
        '/games': {
          get: {
            summary: '获取游戏专区资源列表',
            responses: { 200: { description: '成功返回游戏列表' } }
          }
        },
        '/categories': {
          get: {
            summary: '获取全部分类目录与软件数量',
            responses: { 200: { description: '成功返回分类数组' } }
          }
        },
        '/search': {
          get: {
            summary: '跨分类公开软件关键词搜索',
            parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: '成功返回匹配项' } }
          }
        },
        '/developers/{slug}': {
          get: {
            summary: '获取已认证开发者公开资料',
            parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { 200: { description: '开发者公开档案' } }
          }
        }
      }
    });
  };

  server.get('/api/public/v1/openapi.json', openApiSpecHandler);
  server.get('/api/v1/openapi.json', openApiSpecHandler);

  // 公开接口文档别名重定向
  server.get('/api/docs', async (_req, reply) => {
    return reply.redirect('/developers/api', 302);
  });
}
