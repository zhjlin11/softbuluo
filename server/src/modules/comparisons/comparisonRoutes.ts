import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ComparisonService } from './comparisonService';
import { requireAuth } from '../../middleware/auth';
import { ComparisonStatus, ComparisonAttributeCategory } from '@prisma/client';

export async function comparisonRoutes(fastify: FastifyInstance) {
  // 公开接口：获取已发布对比列表
  fastify.get('/api/v1/comparisons', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page?: string; pageSize?: string };
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '12', 10);

    const result = await ComparisonService.listPublished(page, pageSize);
    return reply.send({ success: true, data: result });
  });

  // 公开接口：获取单篇已发布对比详情
  fastify.get('/api/v1/comparisons/:slug', async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const item = await ComparisonService.getBySlug(slug, true);
    if (!item) {
      return reply.status(404).send({ success: false, error: '对比评测不存在或尚未公开发布' });
    }
    return reply.send({ success: true, data: item });
  });

  // 管理后台：对比列表
  fastify.get('/api/v1/admin/comparisons', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page?: string; pageSize?: string; status?: ComparisonStatus };
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '20', 10);

    const result = await ComparisonService.adminList(page, pageSize, query.status);
    return reply.send({ success: true, data: result });
  });

  // 管理后台：按 ID 获取对比完整数据
  fastify.get('/api/v1/admin/comparisons/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const item = await ComparisonService.getById(id);
    if (!item) {
      return reply.status(404).send({ success: false, error: '对比不存在' });
    }
    return reply.send({ success: true, data: item });
  });

  // 管理后台：创建对比
  fastify.post('/api/v1/admin/comparisons', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      slug: string;
      title: string;
      summary: string;
      conclusion: string;
      targetAudience?: string;
      scenarioGuide?: string;
      status?: ComparisonStatus;
      items: Array<{ softwareId: string; editorNotes?: string; isRecommended?: boolean; sortOrder?: number }>;
      attributes: Array<{
        attributeName: string;
        category?: ComparisonAttributeCategory;
        values: Record<string, string>;
        isHighlighted?: boolean;
        sortOrder?: number;
      }>;
    };

    if (!body.slug || !body.title || !body.summary || !body.conclusion) {
      return reply.status(400).send({ success: false, error: '缺少必填字段 (slug, title, summary, conclusion)' });
    }

    if (!body.items || body.items.length < 2) {
      return reply.status(400).send({ success: false, error: '横向对比必须至少包含两款软件' });
    }

    try {
      const created = await ComparisonService.createComparison(body);
      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 管理后台：更新对比
  fastify.put('/api/v1/admin/comparisons/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as any;

    try {
      const updated = await ComparisonService.updateComparison(id, body);
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 管理后台：删除对比
  fastify.delete('/api/v1/admin/comparisons/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      await ComparisonService.deleteComparison(id);
      return reply.send({ success: true, message: '对比已删除' });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });
}
