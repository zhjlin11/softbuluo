import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, CandidateReviewStatus } from '@prisma/client';
import {
  checkSoftwareUpdate,
  reviewVersionCandidate,
  listVersionCandidates,
} from './versionMonitorService';

export async function versionRoutes(server: FastifyInstance) {
  // 1. 获取版本候选列表
  server.get(
    '/api/v1/admin/version-monitor/candidates',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { page, limit, reviewStatus, softwareId } = req.query as any;

      const result = await listVersionCandidates({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        reviewStatus: reviewStatus as CandidateReviewStatus,
        softwareId,
      });

      return reply.send({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    }
  );

  // 2. 手动触发针对指定软件的版本更新检测
  server.post(
    '/api/v1/admin/version-monitor/check/:softwareId',
    { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { softwareId } = req.params as { softwareId: string };
      try {
        const checkResult = await checkSoftwareUpdate(softwareId);
        return reply.send({
          success: true,
          data: checkResult,
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VERSION_CHECK_FAILED', message: err.message },
        });
      }
    }
  );

  // 3. 审核新版本候选并流转正式发布
  const reviewSchema = z.object({
    action: z.enum(['APPROVE', 'REJECT']),
    reviewNotes: z.string().optional(),
  });

  server.post(
    '/api/v1/admin/version-monitor/candidates/:id/review',
    { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = reviewSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
        });
      }

      try {
        const result = await reviewVersionCandidate({
          candidateId: id,
          action: parseRes.data.action,
          reviewedBy: req.adminUser!.userId,
          reviewNotes: parseRes.data.reviewNotes,
        });

        return reply.send({
          success: true,
          data: result,
        });
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: { code: 'REVIEW_FAILED', message: err.message },
        });
      }
    }
  );

  // 别名路由支持
  server.get(
    '/api/v1/admin/versions/candidates',
    { preHandler: [requireAuth, requireRole([Role.EDITOR, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { page, limit, reviewStatus, softwareId } = req.query as any;
      const result = await listVersionCandidates({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        reviewStatus: reviewStatus as CandidateReviewStatus,
        softwareId,
      });
      return reply.send({ success: true, data: result.items, pagination: result.pagination });
    }
  );

  server.post(
    '/api/v1/admin/versions/candidates/:id/review',
    { preHandler: [requireAuth, requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { action, notes, reviewNotes } = (req.body as any) || {};
      const result = await reviewVersionCandidate({
        candidateId: id,
        action: action || 'APPROVE',
        reviewedBy: req.adminUser!.userId,
        reviewNotes: notes || reviewNotes,
      });
      return reply.send({ success: true, data: result });
    }
  );
}
