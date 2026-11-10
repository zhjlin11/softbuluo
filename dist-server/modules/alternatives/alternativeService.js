import { prisma } from '../../db';
import { AlternativeRelationType, AlternativeReviewStatus } from '@prisma/client';
export class AlternativeService {
    /**
     * 获取某款软件已审核通过的替代方案列表（供前台详情页展示）
     */
    static async getAlternativesForSoftware(slugOrId) {
        // 允许通过 slug 或 id 查询目标软件
        const software = await prisma.software.findFirst({
            where: {
                OR: [{ id: slugOrId }, { slug: slugOrId }],
            },
            select: { id: true, name: true, slug: true },
        });
        if (!software)
            return [];
        const list = await prisma.softwareAlternative.findMany({
            where: {
                softwareId: software.id,
                reviewStatus: AlternativeReviewStatus.APPROVED,
            },
            include: {
                alternativeSoftware: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        iconUrl: true,
                        summary: true,
                        licenseType: true,
                        category: { select: { id: true, name: true, slug: true } },
                        versions: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            select: { version: true, releaseDate: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return list.map((item) => ({
            id: item.id,
            reason: item.reason,
            relationType: item.relationType,
            createdAt: item.createdAt,
            alternative: {
                ...item.alternativeSoftware,
                latestVersion: item.alternativeSoftware.versions[0]?.version || null,
            },
        }));
    }
    /**
     * 管理后台列表
     */
    static async adminList(page = 1, pageSize = 20, status) {
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status)
            where.reviewStatus = status;
        const [total, items] = await Promise.all([
            prisma.softwareAlternative.count({ where }),
            prisma.softwareAlternative.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    software: {
                        select: { id: true, name: true, slug: true, iconUrl: true },
                    },
                    alternativeSoftware: {
                        select: { id: true, name: true, slug: true, iconUrl: true },
                    },
                },
            }),
        ]);
        return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
    }
    /**
     * 创建替代方案关联
     */
    static async createAlternative(data) {
        if (data.softwareId === data.alternativeSoftwareId) {
            throw new Error('不能将软件本身设为自身的替代品');
        }
        const [targetSoftware, altSoftware] = await Promise.all([
            prisma.software.findUnique({ where: { id: data.softwareId } }),
            prisma.software.findUnique({ where: { id: data.alternativeSoftwareId } }),
        ]);
        if (!targetSoftware || !altSoftware) {
            throw new Error('关联的软件不存在');
        }
        const existing = await prisma.softwareAlternative.findUnique({
            where: {
                softwareId_alternativeSoftwareId: {
                    softwareId: data.softwareId,
                    alternativeSoftwareId: data.alternativeSoftwareId,
                },
            },
        });
        if (existing) {
            throw new Error('该软件与替代品的关联已存在');
        }
        return await prisma.softwareAlternative.create({
            data: {
                softwareId: data.softwareId,
                alternativeSoftwareId: data.alternativeSoftwareId,
                reason: data.reason.trim(),
                relationType: data.relationType || AlternativeRelationType.SIMILAR_FUNCTION,
                reviewStatus: data.reviewStatus || AlternativeReviewStatus.APPROVED,
                reviewedBy: data.reviewedBy,
            },
        });
    }
    /**
     * 更新替代方案状态或理由
     */
    static async updateAlternative(id, data) {
        const existing = await prisma.softwareAlternative.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('替代方案关联记录不存在');
        }
        return await prisma.softwareAlternative.update({
            where: { id },
            data,
        });
    }
    /**
     * 删除替代方案
     */
    static async deleteAlternative(id) {
        const existing = await prisma.softwareAlternative.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('替代方案关联记录不存在');
        }
        return await prisma.softwareAlternative.delete({ where: { id } });
    }
}
