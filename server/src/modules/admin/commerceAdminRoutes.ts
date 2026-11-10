import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Role, MemberStatus, OrderStatus, RefundStatus, EntitlementStatus, EntitlementType } from '@prisma/client';
import { detectAnomalies, reconcileExpiredOrders, autoFixAnomaly } from '../orders/reconciliationService';

export async function commerceAdminRoutes(server: FastifyInstance) {
  // 1. 管理员查询前台会员用户列表
  server.get(
    '/api/v1/admin/members',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const { q, status, page = '1', limit = '20' } = req.query as {
        q?: string;
        status?: MemberStatus;
        page?: string;
        limit?: string;
      };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (q && q.trim()) {
        where.OR = [
          { username: { contains: q.trim(), mode: 'insensitive' } },
          { email: { contains: q.trim(), mode: 'insensitive' } },
        ];
      }

      const [total, members] = await Promise.all([
        prisma.memberUser.count({ where }),
        prisma.memberUser.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            status: true,
            avatarUrl: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                orders: true,
                entitlements: true,
              },
            },
          },
        }),
      ]);

      // 批量查询当前有效 VIP
      const now = new Date();
      const memberIds = members.map((m) => m.id);
      const activeVips = await prisma.entitlement.findMany({
        where: {
          userId: { in: memberIds },
          entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
          status: EntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
      });

      const vipMap = new Map(activeVips.map((v) => [v.userId, v.expiresAt]));

      return reply.send({
        success: true,
        data: members.map((m) => ({
          ...m,
          isVip: vipMap.has(m.id),
          vipExpiresAt: vipMap.get(m.id) || null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // 2. 管理员更新会员状态 (冻结 / 封禁 / 解封)
  const updateMemberStatusSchema = z.object({
    status: z.nativeEnum(MemberStatus),
  });

  server.patch(
    '/api/v1/admin/members/:id/status',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const parseRes = updateMemberStatusSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '状态值不合法' },
        });
      }

      const member = await prisma.memberUser.update({
        where: { id },
        data: { status: parseRes.data.status },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'UPDATE_MEMBER_STATUS',
          targetType: 'MEMBER_USER',
          targetId: id,
          after: JSON.stringify({ status: member.status }),
        },
      });

      return reply.send({
        success: true,
        data: member,
      });
    }
  );

  // 3. 管理员查询所有订单 (多维度筛选与分页)
  server.get(
    '/api/v1/admin/orders',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const { orderNo, status, page = '1', limit = '20' } = req.query as {
        orderNo?: string;
        status?: OrderStatus;
        page?: string;
        limit?: string;
      };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (orderNo && orderNo.trim()) {
        where.orderNo = { contains: orderNo.trim() };
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
            product: {
              select: {
                productType: true,
              },
            },
          },
        }),
      ]);

      return reply.send({
        success: true,
        data: orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          username: o.user.username,
          email: o.user.email,
          productName: o.productNameSnapshot,
          productType: o.product.productType,
          totalAmountFen: o.totalAmountFen,
          totalAmountYuan: (o.totalAmountFen / 100).toFixed(2),
          status: o.status,
          payChannel: o.payChannel,
          transactionId: o.transactionId,
          expiresAt: o.expiresAt,
          paidAt: o.paidAt,
          createdAt: o.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // 4. 管理员手动关闭未支付订单
  server.post(
    '/api/v1/admin/orders/:orderNo/close',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const { orderNo } = req.params as { orderNo: string };

      const order = await prisma.order.findUnique({
        where: { orderNo },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
        });
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return reply.status(400).send({
          success: false,
          error: { code: 'CANNOT_CLOSE', message: `订单状态为 ${order.status}，无法直接关闭` },
        });
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // 5. 商业化运营大盘数据统计
  server.get(
    '/api/v1/admin/commerce/stats',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const now = new Date();

      const [
        totalMembers,
        activeVipsCount,
        paidOrdersCount,
        totalRevenueResult,
        pendingRefundsCount,
      ] = await Promise.all([
        prisma.memberUser.count(),
        prisma.entitlement.count({
          where: {
            entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
            status: EntitlementStatus.ACTIVE,
            expiresAt: { gt: now },
          },
        }),
        prisma.order.count({ where: { status: OrderStatus.PAID } }),
        prisma.order.aggregate({
          where: { status: OrderStatus.PAID },
          _sum: { totalAmountFen: true },
        }),
        prisma.refund.count({ where: { status: RefundStatus.PENDING_REVIEW } }),
      ]);

      const totalRevenueFen = totalRevenueResult._sum.totalAmountFen || 0;

      return reply.send({
        success: true,
        data: {
          totalMembers,
          activeVipsCount,
          paidOrdersCount,
          totalRevenueFen,
          totalRevenueYuan: (totalRevenueFen / 100).toFixed(2),
          pendingRefundsCount,
        },
      });
    }
  );

  // 6. 对账系统：查询掉单与权益异常探测报告
  server.get(
    '/api/v1/admin/reconciliation/anomalies',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const anomalies = await detectAnomalies();
      return reply.send({
        success: true,
        data: {
          totalCount: anomalies.length,
          anomalies,
        },
      });
    }
  );

  // 7. 对账系统：手动触发超时未支付订单核销闭环
  server.post(
    '/api/v1/admin/reconciliation/run',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const result = await reconcileExpiredOrders();
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // 8. 对账系统：自动修复指定对账异常
  const fixAnomalySchema = z.object({
    type: z.enum([
      'PAID_WITHOUT_ENTITLEMENT',
      'REFUNDED_WITH_ACTIVE_ENTITLEMENT',
      'OVER_REFUNDED',
      'EXPIRED_PROCESSING_REFUND',
    ]),
    orderId: z.string().min(1),
  });

  server.post(
    '/api/v1/admin/reconciliation/fix',
    { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] },
    async (req, reply) => {
      const parseRes = fixAnomalySchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '参数格式不正确' },
        });
      }

      const { type, orderId } = parseRes.data;
      const fixResult = await autoFixAnomaly(type as any, orderId);

      return reply.send({
        success: fixResult.success,
        data: fixResult,
      });
    }
  );
}

