import { BookmarkService } from './bookmarkService';
import { requireMemberAuth } from '../../middleware/auth';
export const bookmarkRoutes = async (server) => {
    // 需要会员登录
    server.addHook('preHandler', requireMemberAuth);
    // 1. 获取当前登录会员的收藏列表
    server.get('/', async (request, reply) => {
        try {
            const memberId = request.memberUser.memberId;
            const query = request.query;
            const page = parseInt(query.page || '1', 10);
            const pageSize = parseInt(query.pageSize || '20', 10);
            const result = await BookmarkService.listBookmarks(memberId, page, pageSize);
            return reply.send({ success: true, data: result });
        }
        catch (err) {
            server.log.error(err, 'Failed to list bookmarks');
            return reply.status(500).send({ success: false, message: err.message });
        }
    });
    // 2. 添加或更新收藏
    server.post('/', async (request, reply) => {
        try {
            const memberId = request.memberUser.memberId;
            const body = request.body;
            if (!body.targetType || !body.targetId) {
                return reply.status(400).send({ success: false, message: 'targetType and targetId are required' });
            }
            const bookmark = await BookmarkService.addBookmark(memberId, body);
            return reply.status(201).send({
                success: true,
                message: '收藏成功',
                data: bookmark,
            });
        }
        catch (err) {
            server.log.error(err, 'Failed to add bookmark');
            return reply.status(400).send({ success: false, message: err.message });
        }
    });
    // 3. 取消收藏
    server.delete('/:id', async (request, reply) => {
        try {
            const memberId = request.memberUser.memberId;
            const { id } = request.params;
            await BookmarkService.removeBookmark(memberId, id);
            return reply.send({ success: true, message: '已取消收藏' });
        }
        catch (err) {
            server.log.error(err, 'Failed to remove bookmark');
            return reply.status(400).send({ success: false, message: err.message });
        }
    });
};
