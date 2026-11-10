import { prisma } from '../../db';
import { ResourceType } from '@prisma/client';
export class BookmarkService {
    /**
     * 会员添加收藏
     */
    static async addBookmark(memberId, data) {
        // 校验目标资源是否存在
        if (data.targetType === ResourceType.SOFTWARE || data.targetType === ResourceType.GAME || data.targetType === ResourceType.TOOL) {
            const sw = await prisma.software.findUnique({ where: { id: data.targetId } });
            if (!sw)
                throw new Error('收藏的目标软件资源不存在');
        }
        else {
            const tut = await prisma.tutorial.findUnique({ where: { id: data.targetId } });
            if (!tut)
                throw new Error('收藏的目标教程不存在');
        }
        return await prisma.memberBookmark.upsert({
            where: {
                memberId_targetType_targetId: {
                    memberId,
                    targetType: data.targetType,
                    targetId: data.targetId,
                },
            },
            update: {
                notes: data.notes || null,
            },
            create: {
                memberId,
                targetType: data.targetType,
                targetId: data.targetId,
                notes: data.notes || null,
            },
        });
    }
    /**
     * 获取会员个人收藏列表
     */
    static async listBookmarks(memberId, page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const where = { memberId };
        const [total, items] = await Promise.all([
            prisma.memberBookmark.count({ where }),
            prisma.memberBookmark.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        // 填充关联资源详情
        const enriched = await Promise.all(items.map(async (b) => {
            let details = null;
            if (b.targetType === ResourceType.SOFTWARE || b.targetType === ResourceType.GAME || b.targetType === ResourceType.TOOL) {
                details = await prisma.software.findUnique({
                    where: { id: b.targetId },
                    select: { id: true, name: true, slug: true, iconUrl: true, summary: true, licenseType: true },
                });
            }
            else {
                details = await prisma.tutorial.findUnique({
                    where: { id: b.targetId },
                    select: { id: true, title: true, slug: true, summary: true },
                });
            }
            return {
                id: b.id,
                targetType: b.targetType,
                targetId: b.targetId,
                notes: b.notes,
                createdAt: b.createdAt,
                resource: details,
            };
        }));
        return {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            items: enriched,
        };
    }
    /**
     * 取消收藏
     */
    static async removeBookmark(memberId, bookmarkId) {
        const bookmark = await prisma.memberBookmark.findUnique({ where: { id: bookmarkId } });
        if (!bookmark || bookmark.memberId !== memberId) {
            throw new Error('收藏记录不存在或无权操作');
        }
        await prisma.memberBookmark.delete({ where: { id: bookmarkId } });
        return true;
    }
}
