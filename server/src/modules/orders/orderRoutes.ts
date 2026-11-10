import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { generateOrderNo } from '../../utils/security';
import { requireMemberAuth, requireAuth } from '../../middleware/auth';
import { OrderStatus, ProductStatus } from '@prisma/client';

export async function orderRoutes(server: FastifyInstance) {
  // 1. 创建订单 (会员专属，后端防篡改验价)
  const createOrderSchema = z.object({
    productId: z.string().min(1, '请指定商品 ID'),
    quantity: z.number().int().min(1).max(10).default(1),
  });

  server.post(
    '/api/v1/orders',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const parseRes = createOrderSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '订单参数格式不正确' },
        });
      }

      const { productId, quantity } = parseRes.data;
      const userId = req.memberUser!.memberId;

      // 严格从数据库拉取商品信息与分制单价
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.status !== ProductStatus.ACTIVE) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PRODUCT_UNAVAILABLE', message: '该商品已下架或暂不支持购买' },
        });
      }

      // 价格快照计算 (以分为单位，杜绝浮点数精度漏洞与前端金额篡改)
      const priceSnapshotFen = product.priceFen;
      const totalAmountFen = priceSnapshotFen * quantity;
      const orderNo = generateOrderNo();
      // 15 分钟有效支付窗口
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // 初始支付 URL (可在后续发起支付时更新)
      const initialCodeUrl = `weixin://wxpay/bizpayurl?pr=${orderNo}`;

      const order = await prisma.order.create({
        data: {
          orderNo,
          userId,
          productId: product.id,
          productNameSnapshot: product.name,
          priceSnapshotFen,
          quantity,
          totalAmountFen,
          currency: 'CNY',
          status: OrderStatus.PENDING_PAYMENT,
          payChannel: 'WECHAT',
          codeUrl: initialCodeUrl,
          expiresAt,
        },
      });

      return reply.status(201).send({
        success: true,
        data: {
          orderNo: order.orderNo,
          productName: order.productNameSnapshot,
          totalAmountFen: order.totalAmountFen,
          totalAmountYuan: (order.totalAmountFen / 100).toFixed(2),
          status: order.status,
          expiresAt: order.expiresAt,
          codeUrl: order.codeUrl,
          createdAt: order.createdAt,
        },
      });
    }
  );

  // 2. 查询当前会员的订单列表
  server.get(
    '/api/v1/orders',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const userId = req.memberUser!.memberId;
      const now = new Date();

      // 自动将超时的 PENDING_PAYMENT 订单更新为 CLOSED
      await prisma.order.updateMany({
        where: {
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          expiresAt: { lt: now },
        },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: now,
        },
      });

      const orders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              name: true,
              productType: true,
              durationDays: true,
            },
          },
          refunds: {
            select: {
              id: true,
              refundNo: true,
              status: true,
              amountFen: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          productName: o.productNameSnapshot,
          productType: o.product.productType,
          totalAmountFen: o.totalAmountFen,
          totalAmountYuan: (o.totalAmountFen / 100).toFixed(2),
          status: o.status,
          payChannel: o.payChannel,
          transactionId: o.transactionId,
          codeUrl: o.codeUrl,
          expiresAt: o.expiresAt,
          paidAt: o.paidAt,
          closedAt: o.closedAt,
          refundedAt: o.refundedAt,
          createdAt: o.createdAt,
          refund: o.refunds[0] || null,
        })),
      });
    }
  );

  // 3. 获取订单详情 (会员自身或管理员均可查看)
  server.get('/api/v1/orders/:orderNo', async (req, reply) => {
    const { orderNo } = req.params as { orderNo: string };

    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        refunds: true,
      },
    });

    if (!order) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
      });
    }

    // 检查超时自动关闭
    const now = new Date();
    if (order.status === OrderStatus.PENDING_PAYMENT && order.expiresAt < now) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: now,
        },
      });
      order.status = OrderStatus.CLOSED;
      order.closedAt = now;
    }

    // 鉴权：需要是订单本人或后台管理员
    const memberSession = (req.session as any)?.member;
    const adminSession = (req.session as any)?.user;

    const isOwner = memberSession && memberSession.memberId === order.userId;
    const isAdmin = adminSession && !!adminSession.userId;

    if (!isOwner && !isAdmin) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: '无权查看该订单信息' },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: order.id,
        orderNo: order.orderNo,
        productName: order.productNameSnapshot,
        productType: order.product.productType,
        totalAmountFen: order.totalAmountFen,
        totalAmountYuan: (order.totalAmountFen / 100).toFixed(2),
        status: order.status,
        payChannel: order.payChannel,
        transactionId: order.transactionId,
        codeUrl: order.codeUrl,
        expiresAt: order.expiresAt,
        paidAt: order.paidAt,
        closedAt: order.closedAt,
        refundedAt: order.refundedAt,
        createdAt: order.createdAt,
        user: {
          username: order.user.username,
          email: order.user.email,
        },
        refund: order.refunds[0] || null,
      },
    });
  });

  // 4. 用户手动取消未支付订单
  server.post(
    '/api/v1/orders/:orderNo/cancel',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const { orderNo } = req.params as { orderNo: string };
      const userId = req.memberUser!.memberId;

      const order = await prisma.order.findUnique({
        where: { orderNo },
      });

      if (!order || order.userId !== userId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
        });
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        return reply.status(400).send({
          success: false,
          error: { code: 'CANNOT_CANCEL', message: `当前订单状态为 ${order.status}，无法取消` },
        });
      }

      const closed = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        message: '订单已成功取消',
        data: { orderNo: closed.orderNo, status: closed.status },
      });
    }
  );
}
