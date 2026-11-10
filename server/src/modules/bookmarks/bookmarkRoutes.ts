import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { BookmarkService } from './bookmarkService';
import { requireMemberAuth } from '../../middleware/auth';
import { ResourceType } from '@prisma/client';

export const bookmarkRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // 需要会员登录
  server.addHook('preHandler', requireMemberAuth);

  // 1. 获取当前登录会员的收藏列表
  server.get('/', async (request, reply) => {
    try {
      const memberId = request.memberUser!.memberId;
      const query = request.query as { page?: string; pageSize?: string };
      const page = parseInt(query.page || '1', 10);
      const pageSize = parseInt(query.pageSize || '20', 10);

      const result = await BookmarkService.listBookmarks(memberId, page, pageSize);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      server.log.error(err, 'Failed to list bookmarks');
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  // 2. 添加或更新收藏
  server.post('/', async (request, reply) => {
    try {
      const memberId = request.memberUser!.memberId;
      const body = request.body as {
        targetType: ResourceType;
        targetId: string;
        notes?: string;
      };

      if (!body.targetType || !body.targetId) {
        return reply.status(400).send({ success: false, message: 'targetType and targetId are required' });
      }

      const bookmark = await BookmarkService.addBookmark(memberId, body);
      return reply.status(201).send({
        success: true,
        message: '收藏成功',
        data: bookmark,
      });
    } catch (err: any) {
      server.log.error(err, 'Failed to add bookmark');
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  // 3. 取消收藏
  server.delete('/:id', async (request, reply) => {
    try {
      const memberId = request.memberUser!.memberId;
      const { id } = request.params as { id: string };

      await BookmarkService.removeBookmark(memberId, id);
      return reply.send({ success: true, message: '已取消收藏' });
    } catch (err: any) {
      server.log.error(err, 'Failed to remove bookmark');
      return reply.status(400).send({ success: false, message: err.message });
    }
  });
};
