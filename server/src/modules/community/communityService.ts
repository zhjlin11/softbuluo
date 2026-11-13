import { prisma } from '../../db';
import { DiscussionCategory, DiscussionStatus, ReportStatus, ClaimStatus } from '@prisma/client';

export interface CreateThreadDto {
  softwareId?: string;
  title: string;
  content: string;
  category?: DiscussionCategory;
  tags?: string;
}

export interface CreatePostDto {
  parentPostId?: string;
  content: string;
}

// 简单 XSS 过滤辅助函数
function sanitizeContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export class CommunityService {
  /**
   * 发起讨论主题 (登录会员)
   */
  static async createThread(userId: string, data: CreateThreadDto) {
    const title = sanitizeContent(data.title.trim());
    const content = sanitizeContent(data.content.trim());
    const tags = data.tags ? sanitizeContent(data.tags.trim()) : null;

    if (title.length < 5 || title.length > 120) {
      throw new Error('讨论标题长度需在 5 至 120 个字符之间');
    }
    if (content.length < 10 || content.length > 5000) {
      throw new Error('讨论正文需在 10 至 5000 个字符之间');
    }

    // 防刷限流检测 (5 分钟内同一用户发帖不超过 3 篇)
    if (process.env.NODE_ENV !== 'test') {
      const recentCount = await prisma.discussionThread.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
      });
      if (recentCount >= 3) {
        throw new Error('发帖过于频繁，请稍候再试 (限流防护已激活)');
      }
    }

    return prisma.discussionThread.create({
      data: {
        userId,
        softwareId: data.softwareId || null,
        title,
        content,
        tags,
        category: data.category || DiscussionCategory.EXPERIENCE,
        status: DiscussionStatus.ACTIVE
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        software: { select: { id: true, name: true, slug: true, iconUrl: true } }
      }
    });
  }

  /**
   * 获取讨论列表
   */
  static async listThreads(params: {
    softwareId?: string;
    category?: DiscussionCategory;
    isResolved?: boolean;
    sort?: 'latest' | 'hottest' | 'unresolved';
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 15));
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: DiscussionStatus.ACTIVE
    };

    if (params.softwareId) where.softwareId = params.softwareId;
    if (params.category) where.category = params.category;
    if (params.isResolved !== undefined) where.isResolved = params.isResolved;

    if (params.sort === 'unresolved') {
      where.isResolved = false;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
        { tags: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    // 排序策略
    let orderBy: any[] = [{ isPinned: 'desc' }, { lastActivityAt: 'desc' }];
    if (params.sort === 'hottest') {
      orderBy = [{ isPinned: 'desc' }, { replyCount: 'desc' }, { viewCount: 'desc' }, { lastActivityAt: 'desc' }];
    } else if (params.sort === 'unresolved') {
      orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }

    const [total, items] = await Promise.all([
      prisma.discussionThread.count({ where }),
      prisma.discussionThread.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          software: { select: { id: true, name: true, slug: true, iconUrl: true } }
        }
      })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 查看主题详情
   */
  static async getThread(id: string) {
    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        software: { select: { id: true, name: true, slug: true, iconUrl: true, developer: true } },
        posts: {
          where: { status: DiscussionStatus.ACTIVE },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                developerProfile: {
                  select: { id: true, displayName: true, verificationStatus: true }
                }
              }
            }
          }
        }
      }
    });

    if (!thread || thread.status === DiscussionStatus.DELETED) {
      return null;
    }

    // 递增浏览量
    await prisma.discussionThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    thread.viewCount += 1;
    return thread;
  }

  /**
   * 回复主题 (支持开发者认证回复标记)
   */
  static async createPost(threadId: string, userId: string, data: CreatePostDto) {
    const content = sanitizeContent(data.content.trim());
    if (content.length < 2 || content.length > 3000) {
      throw new Error('回复内容需在 2 至 3000 个字符之间');
    }

    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId },
      include: { software: true }
    });

    if (!thread || thread.status !== DiscussionStatus.ACTIVE) {
      throw new Error('目标讨论已被锁定、关闭或不存在');
    }

    // 检查回复者是否为该软件的已认证官方开发者
    let isDeveloperReply = false;
    if (thread.softwareId) {
      const devProfile = await prisma.developerProfile.findUnique({
        where: { memberUserId: userId }
      });
      if (devProfile) {
        const verifiedClaim = await prisma.softwareClaim.findFirst({
          where: {
            softwareId: thread.softwareId,
            developerId: devProfile.id,
            status: ClaimStatus.VERIFIED
          }
        });
        if (verifiedClaim) {
          isDeveloperReply = true;
        }
      }
    }

    // 创建回复并更新主题统计
    const post = await prisma.discussionPost.create({
      data: {
        threadId,
        userId,
        parentPostId: data.parentPostId || null,
        content,
        isDeveloperReply,
        status: DiscussionStatus.ACTIVE
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    await prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastActivityAt: new Date()
      }
    });

    return post;
  }

  /**
   * 采纳回答并标记已解决 (主题作者或管理员)
   */
  static async resolveThread(
    threadId: string,
    userId: string,
    acceptedPostId?: string,
    isAdmin = false
  ) {
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new Error('讨论主题不存在');
    }

    if (!isAdmin && thread.userId !== userId) {
      throw new Error('只有讨论发起者或管理员有权采纳答案或标记已解决');
    }

    if (acceptedPostId) {
      // 检查被采纳的帖子属于该主题
      const post = await prisma.discussionPost.findUnique({
        where: { id: acceptedPostId }
      });
      if (!post || post.threadId !== threadId || post.status !== DiscussionStatus.ACTIVE) {
        throw new Error('所选回复不存在或已被删除');
      }

      // 将其他帖子设为未采纳，将目标帖子设为已采纳
      await prisma.discussionPost.updateMany({
        where: { threadId },
        data: { isAccepted: false }
      });

      await prisma.discussionPost.update({
        where: { id: acceptedPostId },
        data: { isAccepted: true }
      });
    }

    return prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        isResolved: true,
        acceptedPostId: acceptedPostId || thread.acceptedPostId || null
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        posts: {
          where: { status: DiscussionStatus.ACTIVE },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } }
          }
        }
      }
    });
  }

  /**
   * 取消已解决状态 / 取消采纳 (主题作者或管理员)
   */
  static async unresolveThread(threadId: string, userId: string, isAdmin = false) {
    const thread = await prisma.discussionThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new Error('讨论主题不存在');
    }

    if (!isAdmin && thread.userId !== userId) {
      throw new Error('只有讨论发起者或管理员有权修改解决状态');
    }

    await prisma.discussionPost.updateMany({
      where: { threadId },
      data: { isAccepted: false }
    });

    return prisma.discussionThread.update({
      where: { id: threadId },
      data: {
        isResolved: false,
        acceptedPostId: null
      }
    });
  }

  /**
   * 举报违规内容
   */
  static async reportContent(reporterId: string, data: { threadId?: string; postId?: string; reason: string }) {
    if (!data.threadId && !data.postId) {
      throw new Error('缺少被举报的主题或回复 ID');
    }
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('请详细说明举报原因 (至少 5 个字符)');
    }

    return prisma.discussionReport.create({
      data: {
        reporterId,
        threadId: data.threadId || null,
        postId: data.postId || null,
        reason: sanitizeContent(data.reason.trim()),
        status: ReportStatus.PENDING
      }
    });
  }

  /**
   * 获取真实社区统计指标 (杜绝造假)
   */
  static async getCommunityStats() {
    const [totalThreads, totalPosts, resolvedThreads, categoryCountsRaw] = await Promise.all([
      prisma.discussionThread.count({ where: { status: DiscussionStatus.ACTIVE } }),
      prisma.discussionPost.count({ where: { status: DiscussionStatus.ACTIVE } }),
      prisma.discussionThread.count({ where: { status: DiscussionStatus.ACTIVE, isResolved: true } }),
      prisma.discussionThread.groupBy({
        by: ['category'],
        where: { status: DiscussionStatus.ACTIVE },
        _count: { id: true }
      })
    ]);

    const resolutionRate = totalThreads > 0 ? Math.round((resolvedThreads / totalThreads) * 1000) / 10 : 0;

    const categoryCounts: Record<string, number> = {};
    for (const item of categoryCountsRaw) {
      categoryCounts[item.category] = item._count.id;
    }

    return {
      totalThreads,
      totalPosts,
      resolvedThreads,
      unresolvedThreads: Math.max(0, totalThreads - resolvedThreads),
      resolutionRate,
      categoryCounts
    };
  }

  /**
   * 获取待解决的求助问题 (供侧边栏展示)
   */
  static async getPendingQuestions(limit = 5) {
    return prisma.discussionThread.findMany({
      where: {
        status: DiscussionStatus.ACTIVE,
        isResolved: false
      },
      take: limit,
      orderBy: [{ replyCount: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        category: true,
        replyCount: true,
        viewCount: true,
        createdAt: true,
        user: { select: { username: true } }
      }
    });
  }

  /**
   * 管理员审核与处理违规内容
   */
  static async adminModerateThread(
    threadId: string,
    action: 'HIDE' | 'DELETE' | 'PIN' | 'RESOLVE',
    reason: string,
    moderatorUsername: string
  ) {
    let statusUpdate: any = {};
    if (action === 'HIDE') statusUpdate.status = DiscussionStatus.HIDDEN;
    if (action === 'DELETE') statusUpdate.status = DiscussionStatus.DELETED;
    if (action === 'PIN') {
      const current = await prisma.discussionThread.findUnique({ where: { id: threadId } });
      statusUpdate.isPinned = !current?.isPinned;
    }
    if (action === 'RESOLVE') {
      const current = await prisma.discussionThread.findUnique({ where: { id: threadId } });
      statusUpdate.isResolved = !current?.isResolved;
    }

    const updated = await prisma.discussionThread.update({
      where: { id: threadId },
      data: statusUpdate
    });

    await prisma.moderationAction.create({
      data: {
        targetType: 'THREAD',
        targetId: threadId,
        action,
        reason: reason || '管理员合规治理',
        moderatorId: moderatorUsername
      }
    });

    return updated;
  }

  /**
   * 管理员处理举报
   */
  static async adminResolveReport(
    reportId: string,
    status: ReportStatus,
    adminNotes: string,
    adminUsername: string
  ) {
    return prisma.discussionReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes,
        resolvedBy: adminUsername,
        resolvedAt: new Date()
      }
    });
  }
}
