import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { governanceService } from './governanceService';
import { requireAuth } from '../../middleware/auth';
import { DataIntegrityStatus, ResourceStatus } from '@prisma/client';
import { prisma } from '../../db';

export const governanceRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 管理员权限中间件挂载
  server.addHook('preHandler', requireAuth);

  // 1. 获取全站资源数据治理大盘指标
  server.get('/metrics', async (_request, reply) => {
    try {
      const metrics = await governanceService.getGovernanceMetrics();
      return reply.send({ success: true, data: metrics });
    } catch (err: any) {
      server.log.error(err, 'Failed to get governance metrics');
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 2. 触发全量资源数据完整性审计
  server.post('/audit-all', async (_request, reply) => {
    try {
      const metrics = await governanceService.auditAllResources();
      return reply.send({
        success: true,
        message: '数据完整性审计完成',
        data: metrics,
      });
    } catch (err: any) {
      server.log.error(err, 'Failed to audit all resources');
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 3. 获取待审 / 异常资源复核队列
  server.get('/queue', async (request, reply) => {
    try {
      const query = request.query as {
        status?: DataIntegrityStatus;
        page?: string;
        pageSize?: string;
      };

      const result = await governanceService.getAuditQueue({
        status: query.status,
        page: query.page ? parseInt(query.page, 10) : 1,
        pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 20,
      });

      return reply.send({ success: true, data: result });
    } catch (err: any) {
      server.log.error(err, 'Failed to get audit queue');
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 4. 管理员解决资源异常或补充字段
  server.post('/resolve', async (request, reply) => {
    try {
      const body = request.body as {
        softwareId: string;
        dataIntegrityStatus?: DataIntegrityStatus;
        status?: ResourceStatus;
        licenseType?: string;
        officialWebsite?: string;
        auditNotes?: string;
      };

      if (!body.softwareId) {
        return reply.status(400).send({ success: false, message: 'softwareId is required' });
      }

      const updateData: any = {
        lastAuditedAt: new Date(),
      };
      if (body.dataIntegrityStatus) updateData.dataIntegrityStatus = body.dataIntegrityStatus;
      if (body.status) updateData.status = body.status;
      if (body.licenseType) updateData.licenseType = body.licenseType;
      if (body.officialWebsite) updateData.officialWebsite = body.officialWebsite;
      if (body.auditNotes) updateData.auditNotes = body.auditNotes;

      const updated = await prisma.software.update({
        where: { id: body.softwareId },
        data: updateData,
      });

      return reply.send({
        success: true,
        message: '资源信息与治理状态已更新',
        data: updated,
      });
    } catch (err: any) {
      server.log.error(err, 'Failed to resolve resource issue');
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
};
