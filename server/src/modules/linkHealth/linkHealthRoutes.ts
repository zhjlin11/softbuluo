import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, LinkHealthStatus } from '@prisma/client';
import { prisma } from '../../db';
import {
  checkSingleDownloadSource,
  checkAllDownloadSources,
  listLinkCheckLogs,
} from './linkHealthService';

export async function linkHealthRoutes(server: FastifyInstance) {
  // 1. 获取链接检测流水日志列表
  server.get(
    '/api/v1/admin/link-monitor/logs',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { page, limit, healthStatus, sourceId } = req.query as any;

      const result = await listLinkCheckLogs({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        healthStatus: healthStatus as LinkHealthStatus,
        sourceId,
      });

      return reply.send({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    }
  );

  // 2. 手动单点检测指定下载源健康状态
  server.post(
    '/api/v1/admin/link-monitor/check/:sourceId',
    { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { sourceId } = req.params as { sourceId: string };
      try {
        const result = await checkSingleDownloadSource(sourceId);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { code: 'HEALTH_CHECK_FAILED', message: err.message },
        });
      }
    }
  );

  // 3. 批量触发全量或过期链接健康巡检
  const batchSchema = z.object({
    limit: z.number().int().min(1).max(100).optional().default(20),
  });

  server.post(
    '/api/v1/admin/link-monitor/check-all',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const parseRes = batchSchema.safeParse(req.body || {});
      const limit = parseRes.success ? parseRes.data.limit : 20;

      try {
        const result = await checkAllDownloadSources(limit);
        return reply.send({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: { code: 'BATCH_CHECK_FAILED', message: err.message },
        });
      }
    }
  );

  // 4. 路由别名与快捷统计聚合接口
  server.post(
    '/api/v1/admin/link-health/check-batch',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { limit = 20 } = (req.body as any) || {};
      const result = await checkAllDownloadSources(limit);
      return reply.send({ success: true, data: result });
    }
  );

  server.get(
    '/api/v1/admin/link-health/logs',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { page, limit, healthStatus, sourceId } = req.query as any;
      const result = await listLinkCheckLogs({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        healthStatus: healthStatus as LinkHealthStatus,
        sourceId,
      });
      return reply.send({ success: true, data: result });
    }
  );

  server.get(
    '/api/v1/admin/link-health/summary',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const [healthy, redirected, needsReview, broken] = await Promise.all([
        prisma.linkCheckLog.count({ where: { healthStatus: 'HEALTHY' } }),
        prisma.linkCheckLog.count({ where: { healthStatus: 'REDIRECTED' } }),
        prisma.linkCheckLog.count({ where: { healthStatus: 'NEEDS_REVIEW' } }),
        prisma.linkCheckLog.count({ where: { healthStatus: 'BROKEN' } }),
      ]);
      return reply.send({
        success: true,
        data: { healthy, redirected, needsReview, broken },
      });
    }
  );
}
