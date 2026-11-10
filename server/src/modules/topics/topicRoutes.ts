import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, TopicStatus } from '@prisma/client';
import { prisma } from '../../db';

export async function topicRoutes(server: FastifyInstance) {
  // 1. 公开接口：获取已发布的专题列表
  server.get('/api/v1/topics', async (req, reply) => {
    const topics = await prisma.topic.findMany({
      where: { status: TopicStatus.PUBLISHED },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
      include: {
        _count: { select: { resources: true } },
      },
    });

    return reply.send({
      success: true,
      data: topics,
    });
  });

  // 2. 公开接口：根据 Slug 获取专题详情及关联软件
  server.get('/api/v1/topics/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        resources: {
          orderBy: { sortOrder: 'asc' },
          include: {
            software: {
              include: {
                category: { select: { name: true, slug: true } },
                versions: {
                  where: { isLatest: true },
                  take: 1,
                  select: { version: true, platform: true, fileSize: true },
                },
              },
            },
          },
        },
      },
    });

    if (!topic || topic.status !== TopicStatus.PUBLISHED) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TOPIC_NOT_FOUND', message: '专题不存在或尚未发布' },
      });
    }

    return reply.send({
      success: true,
      data: {
        ...topic,
        softwares: topic.resources
          .filter((r) => r.software && r.software.status === 'PUBLISHED')
          .map((r) => ({
            ...r.software,
            customNote: r.customNote,
            latestVersion: r.software.versions[0] || null,
          })),
      },
    });
  });

  // 3. 管理员接口：获取所有专题列表
  server.get(
    '/api/v1/admin/topics',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { status, q } = req.query as { status?: TopicStatus; q?: string };
      const where: any = {};
      if (status) where.status = status;
      if (q && q.trim()) {
        where.OR = [
          { title: { contains: q.trim(), mode: 'insensitive' } },
          { slug: { contains: q.trim(), mode: 'insensitive' } },
        ];
      }

      const topics = await prisma.topic.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
        include: {
          _count: { select: { resources: true } },
        },
      });

      return reply.send({
        success: true,
        data: topics,
      });
    }
  );

  // 4. 管理员接口：创建新专题
  const createTopicSchema = z.object({
    title: z.string().min(2, '专题标题至少2个字符'),
    slug: z.string().min(2, 'Slug 至少2个字符'),
    description: z.string().min(10, '专题简介至少10个字符'),
    coverUrl: z.string().url().optional(),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
    seoTitle: z.string().optional(),
    seoKeywords: z.string().optional(),
    seoDescription: z.string().optional(),
  });

  server.post(
    '/api/v1/admin/topics',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const parseRes = createTopicSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
        });
      }

      const existing = await prisma.topic.findUnique({ where: { slug: parseRes.data.slug } });
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: { code: 'SLUG_EXISTS', message: '该专题 Slug 已经存在，请更换' },
        });
      }

      const topic = await prisma.topic.create({
        data: {
          ...parseRes.data,
          status: TopicStatus.DRAFT,
        },
      });

      return reply.status(201).send({
        success: true,
        data: topic,
      });
    }
  );

  // 5. 管理员接口：更新专题及发布状态
  const updateTopicSchema = z.object({
    title: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    coverUrl: z.string().url().nullable().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    status: z.nativeEnum(TopicStatus).optional(),
    seoTitle: z.string().nullable().optional(),
    seoKeywords: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
  });

  server.patch(
    '/api/v1/admin/topics/:id',
    { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = updateTopicSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
        });
      }

      const existing = await prisma.topic.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '专题不存在' },
        });
      }

      const isPublishing = parseRes.data.status === TopicStatus.PUBLISHED && existing.status !== TopicStatus.PUBLISHED;

      const updated = await prisma.topic.update({
        where: { id },
        data: {
          ...parseRes.data,
          ...(isPublishing && { publishedAt: new Date() }),
        },
      });

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // 6. 管理员接口：关联或更新专题软件列表
  const manageResourcesSchema = z.object({
    resources: z.array(
      z.object({
        softwareId: z.string().min(1),
        sortOrder: z.number().int().optional().default(0),
        customNote: z.string().optional(),
      })
    ),
  });

  server.post(
    '/api/v1/admin/topics/:id/resources',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      // 兼容直接传递单条 { softwareId, customNote } 或批量 { resources: [...] }
      const body = (req.body as any) || {};
      const normalizedBody = Array.isArray(body.resources)
        ? body
        : body.softwareId
        ? { resources: [{ softwareId: body.softwareId, customNote: body.customNote, sortOrder: body.sortOrder || 0 }] }
        : body;

      const parseRes = manageResourcesSchema.safeParse(normalizedBody);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '资源列表格式不正确' },
        });
      }

      await prisma.$transaction(async (tx) => {
        // 先清理旧关联
        await tx.topicResource.deleteMany({ where: { topicId: id } });

        // 重新批量写入
        for (const r of parseRes.data.resources) {
          await tx.topicResource.create({
            data: {
              topicId: id,
              softwareId: r.softwareId,
              sortOrder: r.sortOrder,
              customNote: r.customNote || null,
            },
          });
        }
      });

      return reply.send({
        success: true,
        message: '专题软件列表更新成功',
      });
    }
  );

  // 7. 删除专题
  server.delete(
    '/api/v1/admin/topics/:id',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await prisma.topic.delete({ where: { id } });
      return reply.send({
        success: true,
        message: '专题已删除',
      });
    }
  );
}
