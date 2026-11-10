import { prisma } from '../../db';
import { ReviewStatus } from '@prisma/client';

export class ReviewService {
  /**
   * 前台：获取某款软件已审核的真实用户评价与评分聚合
   */
  static async getReviewsForSoftware(slugOrId: string, page = 1, pageSize = 10) {
    const software = await prisma.software.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!software) {
      return null;
    }

    const where = {
      softwareId: software.id,
      status: ReviewStatus.APPROVED,
      isTestReview: false, // 严格隔离测试评价
    };

    const skip = (page - 1) * pageSize;

    // 并行统计评分分布与获取评价列表
    const [total, ratingsGroup, items] = await Promise.all([
      prisma.softwareReview.count({ where }),
      prisma.softwareReview.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
      prisma.softwareReview.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: { id: true, username: true, email: true, avatarUrl: true },
          },
        },
      }),
    ]);

    // 计算真实的评分分布与加权均分，无评价时不伪造默认 5 星
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRating = 0;

    for (const g of ratingsGroup) {
      distribution[g.rating] = g._count.rating;
      sumRating += g.rating * g._count.rating;
    }

    const averageRating = total > 0 ? parseFloat((sumRating / total).toFixed(1)) : null;

    // 脱敏用户信息
    const sanitizedItems = items.map((rev) => {
      let displayName = rev.user.username;
      if (!displayName && rev.user.email) {
        const parts = rev.user.email.split('@');
        displayName = parts[0].length > 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : `***@${parts[1]}`;
      }
      return {
        id: rev.id,
        rating: rev.rating,
        title: rev.title,
        content: rev.content,
        versionUsed: rev.versionUsed,
        operatingSystem: rev.operatingSystem,
        helpfulCount: rev.helpfulCount,
        unhelpfulCount: rev.unhelpfulCount,
        createdAt: rev.createdAt,
        user: {
          id: rev.user.id,
          username: displayName || '热心部落用户',
          nickname: displayName || '热心部落用户',
          avatarUrl: rev.user.avatarUrl,
        },
      };
    });

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalReviews: total,
        averageRating, // null 表示暂无真实评价
        distribution,
      },
      items: sanitizedItems,
    };
  }

  /**
   * 提交评价（已登录用户）
   */
  static async submitReview(userId: string, data: {
    softwareId: string;
    rating: number;
    title: string;
    content: string;
    versionUsed?: string;
    operatingSystem?: string;
  }) {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error('评分必须在 1 至 5 星之间');
    }

    if (!data.title || data.title.trim().length < 2) {
      throw new Error('评价标题至少需要 2 个字符');
    }

    if (!data.content || data.content.trim().length < 5) {
      throw new Error('评价详细心得至少需要 5 个字符');
    }

    // 检查软件是否存在
    const software = await prisma.software.findUnique({ where: { id: data.softwareId } });
    if (!software) {
      throw new Error('评价的软件资源不存在');
    }

    // XSS 严格安全防护：剥离潜在 HTML/脚本标签，杜绝跨站脚本攻击
    const cleanTitle = data.title.replace(/<[^>]*>?/gm, '').trim();
    const cleanContent = data.content.replace(/<[^>]*>?/gm, '').trim();
    const isTestReview = cleanTitle.includes('测试评价') || cleanContent.includes('自动化测试') || software.isTestData;

    // 判定内容审核策略：若包含违规广告链接则进入人工复核，否则默认 APPROVED 保持用户反馈即时性
    const hasExternalLink = /(https?:\/\/|www\.|\.com|\.cn|\.net|\.org)/i.test(cleanContent + cleanTitle);
    const initialStatus = hasExternalLink ? ReviewStatus.PENDING_REVIEW : ReviewStatus.APPROVED;

    // Upsert 确保单一用户一软件一评
    const review = await prisma.softwareReview.upsert({
      where: {
        softwareId_userId: {
          softwareId: data.softwareId,
          userId,
        },
      },
      update: {
        rating: data.rating,
        title: cleanTitle,
        content: cleanContent,
        versionUsed: data.versionUsed?.trim() || null,
        operatingSystem: data.operatingSystem?.trim() || null,
        status: initialStatus,
        isTestReview,
        updatedAt: new Date(),
      },
      create: {
        softwareId: data.softwareId,
        userId,
        rating: data.rating,
        title: cleanTitle,
        content: cleanContent,
        versionUsed: data.versionUsed?.trim() || null,
        operatingSystem: data.operatingSystem?.trim() || null,
        status: initialStatus,
        isTestReview,
      },
    });

    return {
      review,
      isPendingReview: initialStatus === ReviewStatus.PENDING_REVIEW,
    };
  }

  /**
   * 对评价点赞 / 踩
   */
  static async voteReview(userId: string, reviewId: string, isHelpful: boolean) {
    const review = await prisma.softwareReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new Error('评价记录不存在');
    }

    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: { reviewId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        // 取消原有投票
        await prisma.reviewVote.delete({ where: { id: existingVote.id } });
        await prisma.softwareReview.update({
          where: { id: reviewId },
          data: isHelpful
            ? { helpfulCount: { decrement: 1 } }
            : { unhelpfulCount: { decrement: 1 } },
        });
        return { action: 'removed', isHelpful };
      } else {
        // 反转投票
        await prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { isHelpful },
        });
        await prisma.softwareReview.update({
          where: { id: reviewId },
          data: isHelpful
            ? { helpfulCount: { increment: 1 }, unhelpfulCount: { decrement: 1 } }
            : { helpfulCount: { decrement: 1 }, unhelpfulCount: { increment: 1 } },
        });
        return { action: 'switched', isHelpful };
      }
    } else {
      // 新建投票
      await prisma.reviewVote.create({
        data: { reviewId, userId, isHelpful },
      });
      await prisma.softwareReview.update({
        where: { id: reviewId },
        data: isHelpful
          ? { helpfulCount: { increment: 1 } }
          : { unhelpfulCount: { increment: 1 } },
      });
      return { action: 'added', isHelpful };
    }
  }

  /**
   * 举报不良评价
   */
  static async reportReview(reporterUserId: string, reviewId: string, reason: string, description?: string) {
    const review = await prisma.softwareReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new Error('评价记录不存在');
    }

    return await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterUserId,
        reason,
        description,
        status: 'PENDING',
      },
    });
  }

  /**
   * 提交资源报错/纠错 (失效链接、旧版本、参数有误等)
   */
  static async submitCorrection(data: {
    softwareId: string;
    userId?: string;
    correctionType: string;
    details: string;
    contactEmail?: string;
  }) {
    const software = await prisma.software.findUnique({ where: { id: data.softwareId } });
    if (!software) {
      throw new Error('报错的软件不存在');
    }

    return await prisma.resourceCorrection.create({
      data: {
        softwareId: data.softwareId,
        userId: data.userId || null,
        correctionType: data.correctionType || 'OTHER',
        details: data.details.trim(),
        contactEmail: data.contactEmail?.trim() || null,
        status: 'PENDING',
      },
    });
  }

  // --- 管理后台接口 ---

  static async adminListReviews(page = 1, pageSize = 20, status?: ReviewStatus, softwareId?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;
    if (softwareId) where.softwareId = softwareId;

    const [total, items] = await Promise.all([
      prisma.softwareReview.count({ where }),
      prisma.softwareReview.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          software: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
  }

  static async adminUpdateReviewStatus(id: string, status: ReviewStatus) {
    return await prisma.softwareReview.update({
      where: { id },
      data: { status },
    });
  }

  static async adminDeleteReview(id: string) {
    return await prisma.softwareReview.delete({ where: { id } });
  }

  static async adminListCorrections(page = 1, pageSize = 20, status?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;

    const [total, items] = await Promise.all([
      prisma.resourceCorrection.count({ where }),
      prisma.resourceCorrection.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          software: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
  }

  static async adminUpdateCorrectionStatus(id: string, status: string, moderatedBy?: string) {
    return await prisma.resourceCorrection.update({
      where: { id },
      data: { status, moderatedBy },
    });
  }

  static async adminListReports(page = 1, pageSize = 20, status?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (status) where.status = status;

    const [total, items] = await Promise.all([
      prisma.reviewReport.count({ where }),
      prisma.reviewReport.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            include: {
              software: { select: { id: true, name: true } },
            },
          },
          reporter: { select: { id: true, username: true, email: true } },
        },
      }),
    ]);

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
  }

  static async adminUpdateReportStatus(id: string, status: string, moderatedBy?: string) {
    return await prisma.reviewReport.update({
      where: { id },
      data: { status, moderatedBy },
    });
  }
}
