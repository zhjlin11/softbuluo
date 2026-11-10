import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { prisma } from '../../db';
import { runJob, initDefaultJobs } from './jobSchedulerService';

export async function jobRoutes(server: FastifyInstance) {
  // 确保系统默认作业初始化
  await initDefaultJobs();

  // 1. 获取所有后台调度作业列表
  server.get(
    '/api/v1/admin/jobs',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          runs: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
          _count: { select: { runs: true } },
        },
      });

      return reply.send({
        success: true,
        data: jobs.map((j) => ({
          ...j,
          lastRun: j.runs[0] || null,
        })),
      });
    }
  );

  // 2. 手动触发作业立即执行
  server.post(
    '/api/v1/admin/jobs/:id/trigger',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const result = await runJob(id);
      return reply.status(result.success ? 200 : 409).send({
        success: result.success,
        data: result,
        message: result.message,
      });
    }
  );

  // 3. 查询指定作业的运行历史日志
  server.get(
    '/api/v1/admin/jobs/:id/runs',
    { preHandler: [requireAuth, requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [total, runs] = await Promise.all([
        prisma.jobRun.count({ where: { jobId: id } }),
        prisma.jobRun.findMany({
          where: { jobId: id },
          skip,
          take: limitNum,
          orderBy: { startedAt: 'desc' },
        }),
      ]);

      return reply.send({
        success: true,
        data: runs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // 4. 更新作业状态 (启用/禁用/调整执行周期)
  const updateJobSchema = z.object({
    enabled: z.boolean().optional(),
    intervalSec: z.number().int().min(60).optional(),
    description: z.string().optional(),
  });

  server.patch(
    '/api/v1/admin/jobs/:id',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = updateJobSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '参数校验失败' },
        });
      }

      const updated = await prisma.job.update({
        where: { id },
        data: parseRes.data,
      });

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );
}
