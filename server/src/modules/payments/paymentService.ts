import crypto from 'crypto';
import { prisma } from '../../db';
import { config } from '../../config';
import { OrderStatus, EntitlementStatus, EntitlementType, ProductType } from '@prisma/client';

export interface WechatV3DecryptedResource {
  mchid?: string;
  appid?: string;
  out_trade_no: string;
  transaction_id: string;
  trade_type?: string;
  trade_state: string;
  bank_type?: string;
  attach?: string;
  success_time?: string;
  amount: {
    total: number;
    payer_total?: number;
    currency: string;
    payer_currency?: string;
  };
  payer?: {
    openid?: string;
  };
}

/**
 * 微信支付 API v3 报文解密 (AEAD_AES_256_GCM)
 */
export function decryptWechatV3Resource(
  ciphertext: string,
  nonce: string,
  associatedData: string,
  apiV3Key: string
): WechatV3DecryptedResource {
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  const authTag = ciphertextBuffer.subarray(ciphertextBuffer.length - 16);
  const data = ciphertextBuffer.subarray(0, ciphertextBuffer.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(apiV3Key, 'utf8'), Buffer.from(nonce, 'utf8'));
  decipher.setAuthTag(authTag);
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  }

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * 脱敏支付报文，防止在日志与数据库中存储 PII 隐私信息或敏感凭据
 */
export function sanitizePaymentNotification(payload: any): string {
  if (!payload || typeof payload !== 'object') return '';
  const sanitized = { ...payload };

  // 移除可能存在的私钥、token、明文 cookie
  delete sanitized.privateKey;
  delete sanitized.apiV3Key;
  delete sanitized.session;
  delete sanitized.cookie;

  // 对用户 openid 等个人标识执行掩码
  if (sanitized.payer?.openid) {
    const oid = String(sanitized.payer.openid);
    sanitized.payer = {
      ...sanitized.payer,
      openid: oid.length > 8 ? `${oid.slice(0, 4)}****${oid.slice(-4)}` : '****',
    };
  }

  if (sanitized.resource?.ciphertext) {
    sanitized.resource = {
      ...sanitized.resource,
      ciphertext: `[CIPHERTEXT_MASKED_LEN_${sanitized.resource.ciphertext.length}]`,
    };
  }

  return JSON.stringify(sanitized);
}

/**
 * 为指定订单计算并授予权益（会员顺延叠加 / 单次服务配额）
 * 具备数据库级唯一约束保护，幂等安全
 */
export async function grantEntitlementsForOrder(tx: any, orderId: string): Promise<boolean> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order || !order.product) return false;
  const product = order.product;
  const now = new Date();

  try {
    if (
      product.productType === ProductType.MONTHLY_MEMBERSHIP ||
      product.productType === ProductType.YEARLY_MEMBERSHIP
    ) {
      // 查询该用户目前生效中、未到期的 VIP 权益
      const activeVipList = await tx.entitlement.findMany({
        where: {
          userId: order.userId,
          entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
          status: EntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: 'desc' },
      });

      let startsAt = now;
      let expiresAt: Date;

      if (activeVipList.length > 0 && activeVipList[0].expiresAt) {
        // 顺延叠加：在已有最晚到期时间基础上累加天数
        const latestExpiresAt = activeVipList[0].expiresAt;
        expiresAt = new Date(latestExpiresAt.getTime() + product.durationDays * 24 * 60 * 60 * 1000);
      } else {
        // 从当前时间起算
        expiresAt = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);
      }

      await tx.entitlement.create({
        data: {
          userId: order.userId,
          productId: product.id,
          orderId: order.id,
          entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
          startsAt,
          expiresAt,
          status: EntitlementStatus.ACTIVE,
        },
      });
    } else {
      // 单次服务或单次授权下载
      const entitlementType =
        product.productType === ProductType.LICENSED_DOWNLOAD
          ? EntitlementType.LICENSED_DOWNLOAD
          : EntitlementType.SERVICE_ACCESS;

      await tx.entitlement.create({
        data: {
          userId: order.userId,
          productId: product.id,
          orderId: order.id,
          entitlementType,
          quotaRemaining: order.quantity,
          status: EntitlementStatus.ACTIVE,
          startsAt: now,
          expiresAt: null, // 单次永久/买断直至消费
        },
      });
    }
    return true;
  } catch (entitlementErr: any) {
    if (entitlementErr.code === 'P2002') {
      return true; // 幂等已存在
    }
    throw entitlementErr;
  }
}

/**
 * 核心支付成功处理逻辑 (P0: 真正并发幂等与时长顺延叠加)
 */
export async function processPaymentSuccess(
  orderNo: string,
  transactionId: string,
  rawNotification?: string,
  eventId?: string
): Promise<{ success: boolean; isDuplicate: boolean; order: any; recoveredFromClosed?: boolean }> {
  const now = new Date();
  const sanitizedLog = sanitizePaymentNotification(rawNotification ? JSON.parse(rawNotification) : { transactionId });

  // 使用 PostgreSQL 事务与原子更新条件，严格保障高并发(10/20/50次)下仅有一次生效
  return await prisma.$transaction(async (tx) => {
    // 1. 查询订单
    const order = await tx.order.findUnique({
      where: { orderNo },
      include: { product: true },
    });

    if (!order) {
      throw new Error(`Order ${orderNo} not found`);
    }

    // 若订单已处于 PAID 状态，严格执行幂等排重
    if (order.status === OrderStatus.PAID) {
      return { success: true, isDuplicate: true, order, recoveredFromClosed: false };
    }

    // 若订单已进入退款流程，绝不重新发放支付权益
    if (
      order.status === OrderStatus.REFUND_PENDING ||
      order.status === OrderStatus.PARTIALLY_REFUNDED ||
      order.status === OrderStatus.REFUNDED
    ) {
      return { success: false, isDuplicate: true, order, recoveredFromClosed: false };
    }

    const wasClosed = order.status === OrderStatus.CLOSED;

    // 2. 原子条件更新：仅当状态为 PENDING_PAYMENT 或 CLOSED 时更新为 PAID
    const updateCount = await tx.order.updateMany({
      where: {
        id: order.id,
        status: { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.CLOSED] },
      },
      data: {
        status: OrderStatus.PAID,
        transactionId,
        paidAt: now,
      },
    });

    // 并发竞争：如果已被其他并发事务先一步改为 PAID，updateCount.count 将为 0
    if (updateCount.count === 0) {
      const refreshed = await tx.order.findUniqueOrThrow({ where: { orderNo } });
      return { success: true, isDuplicate: true, order: refreshed, recoveredFromClosed: false };
    }

    const updatedOrder = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { product: true },
    });

    // 3. 权益计算与发放 (具备 @@unique([orderId, entitlementType]) 唯一约束兜底)
    await grantEntitlementsForOrder(tx, updatedOrder.id);


    // 4. 记录脱敏支付流水
    await tx.paymentLog.create({
      data: {
        orderId: updatedOrder.id,
        orderNo: updatedOrder.orderNo,
        channel: 'WECHAT',
        transactionId,
        amountFen: updatedOrder.totalAmountFen,
        status: 'SUCCESS',
        rawNotification: sanitizedLog,
        eventId: eventId || null,
      },
    });

    // 5. 若是超时关闭后恢复入账，记录审计追踪
    if (wasClosed) {
      const adminUser = await tx.user.findFirst();
      if (adminUser) {
        await tx.auditLog.create({
          data: {
            actorId: adminUser.id,
            action: 'AUTO_RECOVER_CLOSED_PAID_ORDER',
            targetType: 'ORDER',
            targetId: updatedOrder.id,
            after: JSON.stringify({
              orderNo: updatedOrder.orderNo,
              transactionId,
              reason: 'Received valid verified payment notification for expired order',
            }),
          },
        });
      }
    }


    return {
      success: true,
      isDuplicate: false,
      order: updatedOrder,
      recoveredFromClosed: wasClosed,
    };
  });
}
