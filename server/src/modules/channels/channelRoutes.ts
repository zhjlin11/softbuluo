import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ResourceStatus, ResourceType, TopicStatus, ComparisonStatus, Role } from '@prisma/client';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  ALLOWED_CHANNELS,
  ALLOWED_SLOTS,
  ALLOWED_TARGET_TYPES,
  SoftwareChannelService,
  validateChannelTarget,
  validateSafeImageUrl,
} from './softwareChannelService';
import { SystemToolsChannelService } from './systemToolsChannelService';
import { GamesChannelService } from './gamesChannelService';
import { EssentialsChannelService } from './essentialsChannelService';
import { CompareChannelService } from './compareChannelService';
import { UpdatesChannelService } from './updatesChannelService';

const createRecommendationSchema = z.object({
  slot: z.enum(ALLOWED_SLOTS),
  targetType: z.enum(ALLOWED_TARGET_TYPES),
  targetId: z.string().min(1, '推荐目标 ID 不能为空'),
  title: z.string().max(120).nullable().optional(),
  subtitle: z.string().max(300).nullable().optional(),
  badgeText: z.string().max(40).nullable().optional(),
  coverImage: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

const updateRecommendationSchema = createRecommendationSchema.partial();

export async function channelRoutes(server: FastifyInstance) {
  // 1. 公开聚合接口：电脑软件频道 UI 3.0 数据中心
  server.get('/api/v1/channels/software', async (_req, reply) => {
    try {
      const data = await SoftwareChannelService.getSoftwareChannelData();
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取电脑软件频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '电脑软件频道数据加载失败' },
      });
    }
  });

  // 1.5 公开聚合接口：系统工具频道 UI 3.0 数据中心 (P8.7.3)
  server.get('/api/v1/channels/system-tools', async (_req, reply) => {
    try {
      const data = await SystemToolsChannelService.getSystemToolsChannelData();
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取系统工具频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '系统工具频道数据加载失败' },
      });
    }
  });

  // 1.6 公开聚合接口：游戏中心频道 UI 3.0 数据中心 (P8.7.4)
  server.get('/api/v1/channels/games', async (_req, reply) => {
    try {
      const data = await GamesChannelService.getGamesChannelData();
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取游戏中心频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '游戏中心频道数据加载失败' },
      });
    }
  });

  // 1.7 公开聚合接口：装机必备频道 UI 3.0 数据中心 (P8.7.5)
  server.get('/api/v1/channels/essentials', async (_req, reply) => {
    try {
      const data = await EssentialsChannelService.getEssentialsChannelData();
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取装机必备频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '装机必备频道数据加载失败' },
      });
    }
  });

  // 1.8 公开聚合接口：对比评测频道 UI 3.0 门户数据中心 (P8.7.6)
  server.get('/api/v1/channels/compare', async (_req, reply) => {
    try {
      const data = await CompareChannelService.getCompareChannelData();
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取对比评测频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '对比评测频道数据加载失败' },
      });
    }
  });

  // 1.9 动态双软件 A/B 参数矩阵比对计算引擎 (P8.7.6)
  server.get('/api/v1/channels/compare/matrix', async (req, reply) => {
    const { left, right } = req.query as { left?: string; right?: string };
    if (!left || !right) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_QUERY_PARAMS', message: '必须同时传入 left 与 right 两款软件的 slug 标识' },
      });
    }

    try {
      const matrix = await CompareChannelService.getComparisonMatrix(left, right);
      return reply.send({ success: true, data: matrix });
    } catch (err: any) {
      const errMsg = err?.message || '对比矩阵生成失败';
      if (errMsg.includes('未找到软件') || errMsg.includes('尚未公开发布')) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SOFTWARE_NOT_FOUND', message: errMsg },
        });
      }
      return reply.status(400).send({
        success: false,
        error: { code: 'COMPARE_MATRIX_ERROR', message: errMsg },
      });
    }
  });

  // 1.10 公开聚合接口：最新更新频道 UI 3.0 门户数据中心 (P8.7.10)
  server.get('/api/v1/channels/updates', async (req, reply) => {
    try {
      const query = req.query as any;
      const data = await UpdatesChannelService.getUpdatesChannelData({
        timeRange: query.timeRange,
        startDate: query.startDate,
        endDate: query.endDate,
        resourceType: query.resourceType,
        categoryId: query.categoryId,
        keyword: query.keyword,
        sort: query.sort,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 15,
      });
      return reply.send({ success: true, data });
    } catch (err: any) {
      server.log.error(err, '获取最新更新频道聚合数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'CHANNEL_AGGREGATION_ERROR', message: '最新更新频道数据加载失败' },
      });
    }
  });

  // 1.11 软件历史版本查询接口 (P8.7.10)
  server.get('/api/v1/channels/updates/version-history/:softwareId', async (req, reply) => {
    const { softwareId } = req.params as { softwareId: string };
    if (!softwareId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_SOFTWARE_ID', message: '软件标识不能为空' },
      });
    }

    try {
      const history = await UpdatesChannelService.getSoftwareVersionHistory(softwareId);
      if (!history) {
        return reply.status(404).send({
          success: false,
          error: { code: 'SOFTWARE_NOT_FOUND', message: '未找到指定已发布软件或该软件不存在' },
        });
      }
      return reply.send({ success: true, data: history });
    } catch (err: any) {
      server.log.error(err, '获取软件历史版本失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'VERSION_HISTORY_ERROR', message: '软件历史版本加载失败' },
      });
    }
  });

  // 2. 管理员接口：获取频道运营推荐位列表
  server.get(
    '/api/v1/admin/channels/:channel/recommendations',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { channel } = req.params as { channel: string };
      const upperChannel = channel.toUpperCase();
      if (!ALLOWED_CHANNELS.includes(upperChannel as any)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_CHANNEL', message: '不支持的频道标识' },
        });
      }

      const recs = await prisma.channelRecommendation.findMany({
        where: { channel: upperChannel },
        orderBy: [{ slot: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      });

      const enriched = await Promise.all(
        recs.map(async (rec) => {
          const check = await validateChannelTarget(rec.targetType, rec.targetId, upperChannel);
          return {
            ...rec,
            targetValid: check.valid,
            targetInvalidReason: check.reason || null,
            targetLabel: check.label || rec.targetId,
          };
        })
      );

      return reply.send({ success: true, data: { items: enriched } });
    }
  );

  // 3. 管理员接口：获取可用于推荐的已发布安全候选资源
  server.get(
    '/api/v1/admin/channels/:channel/candidates',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { channel } = req.params as { channel: string };
      const upperChannel = channel.toUpperCase();
      if (!ALLOWED_CHANNELS.includes(upperChannel as any)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_CHANNEL', message: '不支持的频道标识' },
        });
      }

      const softwareWhere: any =
        upperChannel === 'GAMES'
          ? { status: ResourceStatus.PUBLISHED, isTestData: false, type: ResourceType.GAME }
          : upperChannel === 'SYSTEM_TOOLS'
            ? {
                status: ResourceStatus.PUBLISHED,
                isTestData: false,
                OR: [
                  { type: ResourceType.TOOL },
                  { category: { slug: { in: ['sys-tools', 'hardware', 'network', 'security', 'drivers'] } } },
                ],
              }
            : { status: ResourceStatus.PUBLISHED, isTestData: false, type: { not: ResourceType.GAME } };

      const [softwares, topics, comparisons, tutorials] = await Promise.all([
        prisma.software.findMany({
          where: softwareWhere,
          orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
          select: { id: true, name: true, slug: true, category: { select: { name: true } } },
        }),
        prisma.topic.findMany({
          where: { status: TopicStatus.PUBLISHED, NOT: { slug: { startsWith: 'topic-p3-' } } },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
          select: { id: true, title: true, slug: true },
        }),
        prisma.softwareComparison.findMany({
          where: { status: ComparisonStatus.PUBLISHED },
          select: { id: true, title: true, slug: true },
        }),
        prisma.tutorial.findMany({
          where: { status: 'PUBLISHED', NOT: { slug: { startsWith: 'tut-p3-' } } },
          take: 30,
          orderBy: { publishedAt: 'desc' },
          select: { id: true, title: true, slug: true },
        }),
      ]);

      return reply.send({
        success: true,
        data: { softwares, topics, comparisons, tutorials },
      });
    }
  );

  // 4. 管理员接口：新增推荐位配置（严格拦截未发布资源与非法链接）
  server.post(
    '/api/v1/admin/channels/:channel/recommendations',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { channel } = req.params as { channel: string };
      const upperChannel = channel.toUpperCase();
      if (!ALLOWED_CHANNELS.includes(upperChannel as any)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_CHANNEL', message: '不支持的频道标识' },
        });
      }

      const parsed = createRecommendationSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || '参数校验失败' },
        });
      }

      const body = parsed.data;
      if (body.startAt && body.endAt && new Date(body.startAt) > new Date(body.endAt)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_SCHEDULE', message: '生效开始时间不能晚于结束时间' },
        });
      }

      const targetCheck = await validateChannelTarget(body.targetType, body.targetId, upperChannel);
      if (!targetCheck.valid) {
        return reply.status(400).send({
          success: false,
          error: { code: 'ONLY_PUBLISHED_NON_TEST_ALLOWED', message: targetCheck.reason || '推荐目标不合法' },
        });
      }

      const imageCheck = await validateSafeImageUrl(body.coverImage);
      if (!imageCheck.valid) {
        return reply.status(400).send({
          success: false,
          error: { code: 'UNSAFE_IMAGE_URL', message: imageCheck.reason || '封面图片链接不安全' },
        });
      }

      const rec = await prisma.channelRecommendation.upsert({
        where: {
          channel_slot_targetType_targetId: {
            channel: upperChannel,
            slot: body.slot,
            targetType: body.targetType,
            targetId: body.targetId,
          },
        },
        update: {
          title: body.title?.trim() || null,
          subtitle: body.subtitle?.trim() || null,
          badgeText: body.badgeText?.trim() || null,
          coverImage: imageCheck.normalized,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
          startAt: body.startAt ? new Date(body.startAt) : null,
          endAt: body.endAt ? new Date(body.endAt) : null,
        },
        create: {
          channel: upperChannel,
          slot: body.slot,
          targetType: body.targetType,
          targetId: body.targetId,
          title: body.title?.trim() || null,
          subtitle: body.subtitle?.trim() || null,
          badgeText: body.badgeText?.trim() || null,
          coverImage: imageCheck.normalized,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
          startAt: body.startAt ? new Date(body.startAt) : null,
          endAt: body.endAt ? new Date(body.endAt) : null,
          createdBy: req.adminUser!.userId,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'UPSERT_CHANNEL_RECOMMENDATION',
          targetType: 'CHANNEL_RECOMMENDATION',
          targetId: rec.id,
          after: JSON.stringify(rec),
        },
      });

      return reply.status(201).send({ success: true, data: rec });
    }
  );

  // 5. 管理员接口：更新或启停推荐位
  server.patch(
    '/api/v1/admin/channels/:channel/recommendations/:id',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { channel, id } = req.params as { channel: string; id: string };
      const upperChannel = channel.toUpperCase();
      const existing = await prisma.channelRecommendation.findUnique({ where: { id } });
      if (!existing || existing.channel !== upperChannel) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '推荐配置不存在' },
        });
      }

      const parsed = updateRecommendationSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || '参数错误' },
        });
      }

      const body = parsed.data;
      if (body.targetType || body.targetId) {
        const targetCheck = await validateChannelTarget(
          body.targetType || existing.targetType,
          body.targetId || existing.targetId,
          upperChannel
        );
        if (!targetCheck.valid) {
          return reply.status(400).send({
            success: false,
            error: { code: 'ONLY_PUBLISHED_NON_TEST_ALLOWED', message: targetCheck.reason },
          });
        }
      }

      let normalizedCover = existing.coverImage;
      if (body.coverImage !== undefined) {
        const imageCheck = await validateSafeImageUrl(body.coverImage);
        if (!imageCheck.valid) {
          return reply.status(400).send({
            success: false,
            error: { code: 'UNSAFE_IMAGE_URL', message: imageCheck.reason },
          });
        }
        normalizedCover = imageCheck.normalized;
      }

      const nextStart = body.startAt !== undefined ? (body.startAt ? new Date(body.startAt) : null) : existing.startAt;
      const nextEnd = body.endAt !== undefined ? (body.endAt ? new Date(body.endAt) : null) : existing.endAt;
      if (nextStart && nextEnd && nextStart > nextEnd) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_SCHEDULE', message: '生效开始时间不能晚于结束时间' },
        });
      }

      const updated = await prisma.channelRecommendation.update({
        where: { id },
        data: {
          slot: body.slot ?? existing.slot,
          title: body.title !== undefined ? (body.title?.trim() || null) : existing.title,
          subtitle: body.subtitle !== undefined ? (body.subtitle?.trim() || null) : existing.subtitle,
          badgeText: body.badgeText !== undefined ? (body.badgeText?.trim() || null) : existing.badgeText,
          coverImage: normalizedCover,
          sortOrder: body.sortOrder ?? existing.sortOrder,
          isActive: body.isActive ?? existing.isActive,
          startAt: nextStart,
          endAt: nextEnd,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'UPDATE_CHANNEL_RECOMMENDATION',
          targetType: 'CHANNEL_RECOMMENDATION',
          targetId: id,
          after: JSON.stringify(updated),
        },
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 6. 管理员接口：删除推荐位
  server.delete(
    '/api/v1/admin/channels/:channel/recommendations/:id',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { channel, id } = req.params as { channel: string; id: string };
      const existing = await prisma.channelRecommendation.findUnique({ where: { id } });
      if (!existing || existing.channel !== channel.toUpperCase()) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '推荐配置不存在' },
        });
      }

      await prisma.channelRecommendation.delete({ where: { id } });
      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'DELETE_CHANNEL_RECOMMENDATION',
          targetType: 'CHANNEL_RECOMMENDATION',
          targetId: id,
          before: JSON.stringify(existing),
        },
      });

      return reply.send({ success: true, data: { deletedId: id } });
    }
  );
}
