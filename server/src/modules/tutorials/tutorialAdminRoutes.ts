import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { prisma } from '../../db';

export async function tutorialAdminRoutes(server: FastifyInstance) {
  // 1. 公开接口：获取已发布的教程列表
  server.get('/api/v1/tutorials', async (req, reply) => {
    const { softwareId, page = '1', limit = '20' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'PUBLISHED' };
    if (softwareId) where.softwareId = softwareId;

    const [total, items] = await Promise.all([
      prisma.tutorial.count({ where }),
      prisma.tutorial.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { publishedAt: 'desc' },
        include: {
          software: { select: { id: true, name: true, slug: true, iconUrl: true } },
        },
      }),
    ]);

    return reply.send({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  // 2. 公开接口：获取教程详情
  server.get('/api/v1/tutorials/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    const tutorial = await prisma.tutorial.findUnique({
      where: { slug },
      include: {
        software: { select: { id: true, name: true, slug: true, iconUrl: true, developer: true } },
      },
    });

    if (!tutorial || tutorial.status !== 'PUBLISHED') {
      return reply.status(404).send({
        success: false,
        error: { code: 'TUTORIAL_NOT_FOUND', message: '教程不存在或未公开发布' },
      });
    }

    // 更新阅读计数
    await prisma.tutorial.update({
      where: { id: tutorial.id },
      data: { viewCount: { increment: 1 } },
    });

    return reply.send({
      success: true,
      data: tutorial,
    });
  });

  // 3. 管理员接口：获取所有教程（含草稿）
  server.get(
    '/api/v1/admin/tutorials',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { status, q, page = '1', limit = '20' } = req.query as any;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) where.status = status;
      if (q && q.trim()) {
        where.OR = [
          { title: { contains: q.trim(), mode: 'insensitive' } },
          { summary: { contains: q.trim(), mode: 'insensitive' } },
        ];
      }

      const [total, items] = await Promise.all([
        prisma.tutorial.count({ where }),
        prisma.tutorial.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { updatedAt: 'desc' },
          include: {
            software: { select: { id: true, name: true } },
          },
        }),
      ]);

      return reply.send({
        success: true,
        data: items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // 4. 管理员接口：新建教程
  const createTutorialSchema = z.object({
    title: z.string().min(2, '标题至少2个字'),
    slug: z.string().min(2, 'Slug 至少2个字'),
    summary: z.string().min(5, '摘要至少5个字'),
    content: z.string().min(20, '教程正文至少20个字'),
    coverUrl: z.string().url().optional(),
    softwareId: z.string().optional(),
    isPremium: z.boolean().optional().default(false),
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
    seoTitle: z.string().optional(),
    seoKeywords: z.string().optional(),
    seoDescription: z.string().optional(),
  });

  server.post(
    '/api/v1/admin/tutorials',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const parseRes = createTutorialSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
        });
      }

      const existing = await prisma.tutorial.findUnique({ where: { slug: parseRes.data.slug } });
      if (existing) {
        return reply.status(409).send({
          success: false,
          error: { code: 'SLUG_EXISTS', message: '教程 Slug 已存在，请更换' },
        });
      }

      const isPublished = parseRes.data.status === 'PUBLISHED';

      const tutorial = await prisma.tutorial.create({
        data: {
          ...parseRes.data,
          authorId: req.adminUser!.userId,
          publishedAt: isPublished ? new Date() : null,
        },
      });

      return reply.status(201).send({
        success: true,
        data: tutorial,
      });
    }
  );

  // 5. 管理员接口：编辑教程
  const updateTutorialSchema = z.object({
    title: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    summary: z.string().min(5).optional(),
    content: z.string().min(20).optional(),
    coverUrl: z.string().url().nullable().optional(),
    softwareId: z.string().nullable().optional(),
    isPremium: z.boolean().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    seoTitle: z.string().nullable().optional(),
    seoKeywords: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
  });

  server.patch(
    '/api/v1/admin/tutorials/:id',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = updateTutorialSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '参数校验失败' },
        });
      }

      const existing = await prisma.tutorial.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '教程不存在' },
        });
      }

      const isPublishing = parseRes.data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

      const updated = await prisma.tutorial.update({
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

  // 6. 删除教程
  server.delete(
    '/api/v1/admin/tutorials/:id',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      await prisma.tutorial.delete({ where: { id } });
      return reply.send({
        success: true,
        message: '教程已删除',
      });
    }
  );
}
