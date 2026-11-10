import { prisma } from '../../db';
import { config } from '../../config';
import { OrderStatus, RefundStatus, EntitlementStatus, ProductType, EntitlementType } from '@prisma/client';
import { sanitizePaymentNotification } from '../payments/paymentService';

/**
 * 重新核算并对齐用户剩余有效会员权益的起止时间（防止中途退款导致未来订单断档或过期时间失准）
 */
export async function realignUserVipEntitlements(tx: any, userId: string): Promise<void> {
  const now = new Date();
  const activeVipList = await tx.entitlement.findMany({
    where: {
      userId,
      entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
      status: EntitlementStatus.ACTIVE,
    },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  let currentCursor = now;
  for (const ent of activeVipList) {
    const durationDays = ent.product?.durationDays || 30;
    const newStartsAt = currentCursor;
    const newExpiresAt = new Date(currentCursor.getTime() + durationDays * 24 * 60 * 60 * 1000);

    if (ent.startsAt.getTime() !== newStartsAt.getTime() || ent.expiresAt?.getTime() !== newExpiresAt.getTime()) {
      await tx.entitlement.update({
        where: { id: ent.id },
        data: {
          startsAt: newStartsAt,
          expiresAt: newExpiresAt,
        },
      });
    }
    currentCursor = newExpiresAt;
  }
}

/**
 * 确认微信退款到账成功并原子流转订单与权益 (P0: 严禁未确认真实到账即提前标记成功)
 */
export async function confirmRefundSuccess(
  refundNo: string,
  providerRefundId?: string,
  rawNotification?: string,
  actorId?: string
): Promise<{ success: boolean; isDuplicate: boolean; refund: any; order: any }> {
  const now = new Date();
  const sanitizedLog = sanitizePaymentNotification(rawNotification ? JSON.parse(rawNotification) : { providerRefundId });

  return await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { refundNo },
      include: { order: { include: { product: true, entitlements: true } } },
    });

    if (!refund) {
      throw new Error(`Refund ${refundNo} not found`);
    }

    // 幂等检查：若退款已确认为 SUCCESS，直接返回
    if (refund.status === RefundStatus.SUCCESS) {
      return { success: true, isDuplicate: true, refund, order: refund.order };
    }

    // 1. 原子更新退款单状态为 SUCCESS
    const updatedRefund = await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: RefundStatus.SUCCESS,
        providerRefundId: providerRefundId || refund.providerRefundId,
        processedAt: now,
      },
    });

    const order = refund.order;
    const newTotalRefunded = (order.totalRefundedFen || 0) + refund.amountFen;
    const isFullRefund = newTotalRefunded >= order.totalAmountFen;

    // 2. 更新订单状态 (全额退款为 REFUNDED，部分退款为 PARTIALLY_REFUNDED)
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        totalRefundedFen: newTotalRefunded,
        status: isFullRefund ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED,
        refundedAt: isFullRefund ? now : order.refundedAt,
      },
    });

    // 3. 关联权益精确调整 (P0: 多笔续费订单只收回本次退款对应订单的权益，绝不清空用户的其他合法权益)
    const orderEntitlements = await tx.entitlement.findMany({
      where: { orderId: order.id },
    });

    for (const ent of orderEntitlements) {
      await tx.entitlement.update({
        where: { id: ent.id },
        data: {
          status: EntitlementStatus.REVOKED,
          quotaRemaining: 0,
        },
      });
    }

    // 重新对齐并重算用户的剩余会员有效期，防止中间订单退款导致后续订单日期错位
    await realignUserVipEntitlements(tx, order.userId);

    // 4. 登记退款流水日志
    await tx.paymentLog.create({
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        channel: order.payChannel || 'WECHAT',
        transactionId: providerRefundId || `REF_TX_${Date.now()}`,
        amountFen: refund.amountFen,
        status: 'REFUND',
        rawNotification: sanitizedLog,
      },
    });

    // 5. 记录审计追踪
    const actorUser = actorId ? await tx.user.findUnique({ where: { id: actorId } }) : await tx.user.findFirst();
    if (actorUser) {
      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: 'CONFIRM_REFUND_SUCCESS',
          targetType: 'REFUND',
          targetId: refund.id,
          after: JSON.stringify({
            refundNo,
            orderNo: order.orderNo,
            amountFen: refund.amountFen,
            newStatus: updatedOrder.status,
            entitlementsRevoked: orderEntitlements.length,
          }),
        },
      });
    }

    return {
      success: true,
      isDuplicate: false,
      refund: updatedRefund,
      order: updatedOrder,
    };
  });
}

/**
 * 处理微信退款异常或失败
 */
export async function handleRefundFailure(
  refundNo: string,
  failureReason: string,
  actorId?: string
): Promise<{ success: boolean; refund: any }> {
  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { refundNo },
      include: { order: true },
    });

    if (!refund) throw new Error(`Refund ${refundNo} not found`);

    const updatedRefund = await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: RefundStatus.FAILED,
        rejectReason: `渠道退款失败: ${failureReason}`,
        processedAt: now,
      },
    });

    // 恢复订单为 PAID，保持权益正常
    await tx.order.update({
      where: { id: refund.orderId },
      data: { status: OrderStatus.PAID },
    });

    const actorUser = actorId ? await tx.user.findUnique({ where: { id: actorId } }) : await tx.user.findFirst();
    if (actorUser) {
      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: 'REFUND_CHANNEL_FAILED',
          targetType: 'REFUND',
          targetId: refund.id,
          after: JSON.stringify({ refundNo, failureReason }),
        },
      });
    }

    return { success: true, refund: updatedRefund };
  });
}
