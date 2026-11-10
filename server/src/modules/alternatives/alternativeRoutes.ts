import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AlternativeService } from './alternativeService';
import { requireAuth } from '../../middleware/auth';
import { AlternativeRelationType, AlternativeReviewStatus } from '@prisma/client';

export async function alternativeRoutes(fastify: FastifyInstance) {
  // 公开接口：获取指定软件的替代方案
  fastify.get('/api/v1/software/:slug/alternatives', async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const { slug } = request.params;
    const alternatives = await AlternativeService.getAlternativesForSoftware(slug);
    return reply.send({ success: true, data: alternatives });
  });

  // 管理后台：替代方案列表
  fastify.get('/api/v1/admin/alternatives', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page?: string; pageSize?: string; status?: AlternativeReviewStatus };
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '20', 10);

    const result = await AlternativeService.adminList(page, pageSize, query.status);
    return reply.send({ success: true, data: result });
  });

  // 管理后台：新增替代方案关联
  fastify.post('/api/v1/admin/alternatives', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      softwareId: string;
      alternativeSoftwareId: string;
      reason: string;
      relationType?: AlternativeRelationType;
      reviewStatus?: AlternativeReviewStatus;
    };

    if (!body.softwareId || !body.alternativeSoftwareId || !body.reason) {
      return reply.status(400).send({ success: false, error: '缺少必填字段 (softwareId, alternativeSoftwareId, reason)' });
    }

    try {
      const created = await AlternativeService.createAlternative({
        ...body,
        reviewedBy: (request as any).adminUser?.username || 'admin',
      });
      return reply.status(201).send({ success: true, data: created });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 管理后台：更新替代方案状态或理由
  fastify.put('/api/v1/admin/alternatives/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as {
      reason?: string;
      relationType?: AlternativeRelationType;
      reviewStatus?: AlternativeReviewStatus;
    };

    try {
      const updated = await AlternativeService.updateAlternative(id, {
        ...body,
        reviewedBy: (request as any).adminUser?.username,
      });
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // 管理后台：删除替代方案关联
  fastify.delete('/api/v1/admin/alternatives/:id', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
      await AlternativeService.deleteAlternative(id);
      return reply.send({ success: true, message: '关联已删除' });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });
}
