import { FastifyInstance } from 'fastify';
import { CommunityService } from './communityService';
import { requireMemberAuth, requireRole } from '../../middleware/auth';
import { Role, DiscussionCategory, ReportStatus } from '@prisma/client';
import { prisma } from '../../db';

export async function communityRoutes(server: FastifyInstance) {
  /**
   * ==========================================
   * 公开社区讨论接口
   * ==========================================
   */

  // 获取讨论主题列表 (支持分类、状态、搜索、排序)
  server.get('/api/v1/community/threads', async (req, reply) => {
    const query = req.query as any;
    const result = await CommunityService.listThreads({
      softwareId: query.softwareId,
      category: query.category as DiscussionCategory,
      isResolved: query.isResolved === 'true' ? true : query.isResolved === 'false' ? false : undefined,
      sort: query.sort as any,
      search: query.search,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 15
    });
    return reply.send({ success: true, data: result.items, pagination: result.pagination });
  });

  // 获取真实社区统计看板
  server.get('/api/v1/community/stats', async (_req, reply) => {
    const stats = await CommunityService.getCommunityStats();
    return reply.send({ success: true, data: stats });
  });

  // 获取待解决的求助问题 (供侧边栏互动)
  server.get('/api/v1/community/pending', async (req, reply) => {
    const query = req.query as any;
    const limit = query.limit ? parseInt(query.limit) : 5;
    const items = await CommunityService.getPendingQuestions(limit);
    return reply.send({ success: true, data: items });
  });

  // 获取指定主题详情及回复流
  server.get('/api/v1/community/threads/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const thread = await CommunityService.getThread(id);
    if (!thread) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '讨论主题不存在或已被关闭' }
      });
    }
    return reply.send({ success: true, data: thread });
  });

  /**
   * ==========================================
   * 需登录操作接口 (创建主题、回复、解决、举报)
   * ==========================================
   */

  // 发起讨论
  server.post('/api/v1/community/threads', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const body = req.body as any;

    try {
      const thread = await CommunityService.createThread(memberId, {
        softwareId: body.softwareId,
        title: body.title,
        content: body.content,
        category: body.category,
        tags: body.tags
      });
      return reply.send({ success: true, data: thread });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 采纳最佳解答并标记已解决
  server.post('/api/v1/community/threads/:id/resolve', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { id } = req.params as { id: string };
    const body = (req.body as any) || {};

    try {
      const updated = await CommunityService.resolveThread(id, memberId, body.acceptedPostId, false);
      return reply.send({ success: true, data: updated, message: '已成功采纳最佳解答并标记为已解决！' });
    } catch (err: any) {
      const statusCode = err.message.includes('只有讨论发起者') ? 403 : 400;
      return reply.status(statusCode).send({ success: false, error: { message: err.message } });
    }
  });

  // 取消已解决状态 / 取消采纳
  server.post('/api/v1/community/threads/:id/unresolve', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { id } = req.params as { id: string };

    try {
      const updated = await CommunityService.unresolveThread(id, memberId, false);
      return reply.send({ success: true, data: updated, message: '已取消解决状态' });
    } catch (err: any) {
      const statusCode = err.message.includes('只有讨论发起者') ? 403 : 400;
      return reply.status(statusCode).send({ success: false, error: { message: err.message } });
    }
  });

  // 回复讨论
  server.post('/api/v1/community/threads/:id/posts', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const { id } = req.params as { id: string };
    const body = req.body as any;

    try {
      const post = await CommunityService.createPost(id, memberId, {
        parentPostId: body.parentPostId,
        content: body.content
      });
      return reply.send({ success: true, data: post });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  // 举报内容
  server.post('/api/v1/community/reports', { preHandler: [requireMemberAuth] }, async (req, reply) => {
    const memberId = (req as any).memberUser.memberId;
    const body = req.body as any;

    try {
      const report = await CommunityService.reportContent(memberId, {
        threadId: body.threadId,
        postId: body.postId,
        reason: body.reason
      });
      return reply.send({ success: true, data: report, message: '举报已提交，感谢维护社区健康！' });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: { message: err.message } });
    }
  });

  /**
   * ==========================================
   * 管理后台社区治理接口
   * ==========================================
   */

  // 管理员获取主题列表 (含被隐藏内容)
  server.get(
    '/api/v1/admin/community/threads',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { status } = req.query as { status?: string };
      const where: any = {};
      if (status) where.status = status;

      const threads = await prisma.discussionThread.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, email: true } },
          software: { select: { id: true, name: true, slug: true } },
          _count: { select: { posts: true, reports: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send({ success: true, data: threads });
    }
  );

  // 管理员操作主题 (置顶、隐藏、删除、标记已解决)
  server.post(
    '/api/v1/admin/community/threads/:id/action',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { action, reason } = req.body as any;

      if (!['HIDE', 'DELETE', 'PIN', 'RESOLVE'].includes(action)) {
        return reply.status(400).send({ success: false, error: { message: '不支持的操作类型' } });
      }

      const updated = await CommunityService.adminModerateThread(
        id,
        action,
        reason || '',
        req.adminUser!.username
      );

      return reply.send({ success: true, data: updated });
    }
  );

  // 管理员获取待处理举报
  server.get(
    '/api/v1/admin/community/reports',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const reports = await prisma.discussionReport.findMany({
        include: {
          reporter: { select: { id: true, username: true } },
          thread: { select: { id: true, title: true } },
          post: { select: { id: true, content: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return reply.send({ success: true, data: reports });
    }
  );

  // 管理员处理举报
  server.post(
    '/api/v1/admin/community/reports/:id/resolve',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status, adminNotes } = req.body as any;

      if (!status || !Object.values(ReportStatus).includes(status)) {
        return reply.status(400).send({ success: false, error: { message: '处理状态无效' } });
      }

      const updated = await CommunityService.adminResolveReport(
        id,
        status,
        adminNotes || '',
        req.adminUser!.username
      );

      return reply.send({ success: true, data: updated });
    }
  );
}
