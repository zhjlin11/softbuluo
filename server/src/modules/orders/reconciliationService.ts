import { prisma } from '../../db';
import { OrderStatus, EntitlementStatus, RefundStatus, EntitlementType } from '@prisma/client';
import { grantEntitlementsForOrder } from '../payments/paymentService';

export interface AnomalyReport {
  type: 'PAID_WITHOUT_ENTITLEMENT' | 'REFUNDED_WITH_ACTIVE_ENTITLEMENT' | 'OVER_REFUNDED' | 'EXPIRED_PROCESSING_REFUND';
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  orderNo: string;
  orderId: string;
  userId: string;
  description: string;
  details: Record<string, any>;
  suggestedAction: string;
}

/**
 * 自动核销超时未支付订单（超过 15 分钟失效期）
 */
export async function reconcileExpiredOrders(): Promise<{
  scannedCount: number;
  closedCount: number;
  recoveredCount: number;
}> {
  const now = new Date();
  const expiredOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_PAYMENT,
      expiresAt: { lte: now },
    },
    include: {
      payments: true,
    },
  });

  let closedCount = 0;
  let recoveredCount = 0;

  for (const order of expiredOrders) {
    // 检查是否有由于网络延迟未及时更新但实际微信已扣款成功的 PaymentLog
    const successfulLog = order.payments.find((l) => l.status === 'SUCCESS');

    if (successfulLog) {
      // 真实扣款成功，执行自动对账恢复，补发权益
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: successfulLog.createdAt || now,
          },
        });
        await grantEntitlementsForOrder(tx, order.id);
      });
      recoveredCount++;
    } else {
      // 未付款，正常关闭订单释放库存
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CLOSED,
          closedAt: now,
        },
      });
      closedCount++;
    }
  }

  return {
    scannedCount: expiredOrders.length,
    closedCount,
    recoveredCount,
  };
}

/**
 * 全量对账异常探测（识别掉单、少发权益、退款未收回等隐患）
 */
export async function detectAnomalies(): Promise<AnomalyReport[]> {
  const anomalies: AnomalyReport[] = [];
  const now = new Date();

  // 1. 探测已支付但无任何权益记录的掉单情况
  const paidOrdersWithoutEntitlement = await prisma.order.findMany({
    where: {
      status: OrderStatus.PAID,
      entitlements: { none: {} },
    },
    include: {
      user: { select: { username: true, email: true } },
      product: true,
    },

  });

  for (const order of paidOrdersWithoutEntitlement) {
    anomalies.push({
      type: 'PAID_WITHOUT_ENTITLEMENT',
      severity: 'CRITICAL',
      orderNo: order.orderNo,
      orderId: order.id,
      userId: order.userId,
      description: `订单已标记为支付成功，但未关联任何会员或下载权益记录`,
      details: {
        paidAt: order.paidAt,
        amountFen: order.totalAmountFen,
        userEmail: order.user.email,
      },
      suggestedAction: '调用 grantEntitlementsForOrder 补发权益',
    });
  }

  // 2. 探测已全额退款但仍持有有效 ACTIVE 权益的违规情况
  const refundedOrdersWithActiveEntitlement = await prisma.order.findMany({
    where: {
      status: OrderStatus.REFUNDED,
      entitlements: {
        some: {
          status: EntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
      },
    },
    include: {
      entitlements: true,
      user: { select: { username: true, email: true } },
    },
  });

  for (const order of refundedOrdersWithActiveEntitlement) {
    const activeEntitlements = order.entitlements.filter((e) => e.status === EntitlementStatus.ACTIVE);
    anomalies.push({
      type: 'REFUNDED_WITH_ACTIVE_ENTITLEMENT',
      severity: 'HIGH',
      orderNo: order.orderNo,
      orderId: order.id,
      userId: order.userId,
      description: `订单已全额退款，但仍有 ${activeEntitlements.length} 条有效权益未收回`,
      details: {
        activeEntitlements: activeEntitlements.map((e) => ({
          id: e.id,
          type: e.entitlementType,
          expiresAt: e.expiresAt,
        })),
        totalRefundedFen: order.totalRefundedFen,
      },
      suggestedAction: '将对应订单的生效权益更新为 REVOKED',
    });
  }

  // 3. 探测超额退款情况
  const overRefundedOrders = await prisma.order.findMany({
    where: {
      totalRefundedFen: { gt: 0 },
    },
  });

  for (const order of overRefundedOrders) {
    if (order.totalRefundedFen > order.totalAmountFen) {
      anomalies.push({
        type: 'OVER_REFUNDED',
        severity: 'CRITICAL',
        orderNo: order.orderNo,
        orderId: order.id,
        userId: order.userId,
        description: `订单累计退款金额 (${order.totalRefundedFen}分) 超过订单实际支付总额 (${order.totalAmountFen}分)`,
        details: {
          totalAmountFen: order.totalAmountFen,
          totalRefundedFen: order.totalRefundedFen,
          deltaFen: order.totalRefundedFen - order.totalAmountFen,
        },
        suggestedAction: '人工对账审核第三方支付渠道实际出款账单',
      });
    }
  }

  return anomalies;
}

/**
 * 自动修复特定对账异常
 */
export async function autoFixAnomaly(anomalyType: AnomalyReport['type'], orderId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { entitlements: true },
  });

  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  if (anomalyType === 'PAID_WITHOUT_ENTITLEMENT' && order.status === OrderStatus.PAID) {
    await prisma.$transaction(async (tx) => {
      await grantEntitlementsForOrder(tx, order.id);
    });
    return { success: true, message: `已成功为订单 ${order.orderNo} 补发权益` };
  }

  if (anomalyType === 'REFUNDED_WITH_ACTIVE_ENTITLEMENT' && order.status === OrderStatus.REFUNDED) {
    const updated = await prisma.entitlement.updateMany({
      where: {
        orderId: order.id,
        status: EntitlementStatus.ACTIVE,
      },
      data: {
        status: EntitlementStatus.REVOKED,
      },
    });
    return { success: true, message: `已收回订单 ${order.orderNo} 关联的 ${updated.count} 条权益` };
  }

  return { success: false, message: '未找到支持的自动修复规则或状态不匹配' };
}
