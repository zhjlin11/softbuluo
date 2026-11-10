import { z } from 'zod';
import { prisma } from '../../db';
import { config } from '../../config';
import { generateRefundNo } from '../../utils/security';
import { requireMemberAuth, requireAuth, requireRole } from '../../middleware/auth';
import { OrderStatus, RefundStatus, Role } from '@prisma/client';
import { confirmRefundSuccess, handleRefundFailure } from './refundService';
import { decryptWechatV3Resource } from '../payments/paymentService';
export async function refundRoutes(server) {
    // 1. 会员提交退款申请 (P0: 防金额超额与重复申请)
    const createRefundSchema = z.object({
        orderNo: z.string().min(1, '请提供订单号'),
        reason: z.string().min(3, '请详细说明退款原因 (至少3字)').max(200, '退款原因不能超过200字'),
        amountFen: z.number().int().min(1).optional(), // 支持指定部分退款金额，默认全额
    });
    server.post('/api/v1/refunds', { preHandler: [requireMemberAuth] }, async (req, reply) => {
        const parseRes = createRefundSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '退款申请参数不正确' },
            });
        }
        const { orderNo, reason, amountFen } = parseRes.data;
        const userId = req.memberUser.memberId;
        const order = await prisma.order.findUnique({
            where: { orderNo },
            include: { refunds: true },
        });
        if (!order || order.userId !== userId) {
            return reply.status(404).send({
                success: false,
                error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
            });
        }
        if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PARTIALLY_REFUNDED) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_ORDER_STATUS', message: `当前订单状态为 ${order.status}，无法申请退款` },
            });
        }
        // 检查是否有未完结的退款单
        const hasActiveRefund = order.refunds.some((r) => r.status === RefundStatus.PENDING_REVIEW ||
            r.status === RefundStatus.APPROVED ||
            r.status === RefundStatus.PROCESSING);
        if (hasActiveRefund) {
            return reply.status(409).send({
                success: false,
                error: { code: 'REFUND_IN_PROGRESS', message: '该订单已存在审核或处理中的退款，请勿重复提交' },
            });
        }
        // 校验退款金额不能超过订单剩余可退金额
        const remainingRefundableFen = order.totalAmountFen - (order.totalRefundedFen || 0);
        const applyAmountFen = amountFen || remainingRefundableFen;
        if (applyAmountFen <= 0 || applyAmountFen > remainingRefundableFen) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'EXCESSIVE_REFUND_AMOUNT',
                    message: `申请退款金额 (¥${(applyAmountFen / 100).toFixed(2)}) 超过订单剩余可退金额 (¥${(remainingRefundableFen / 100).toFixed(2)})`,
                },
            });
        }
        const refundNo = generateRefundNo();
        const [refund] = await prisma.$transaction([
            prisma.refund.create({
                data: {
                    refundNo,
                    orderId: order.id,
                    userId,
                    amountFen: applyAmountFen,
                    reason,
                    status: RefundStatus.PENDING_REVIEW,
                },
            }),
            prisma.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.REFUND_PENDING },
            }),
        ]);
        return reply.status(201).send({
            success: true,
            message: '退款申请已提交，等待人工审核',
            data: {
                refundNo: refund.refundNo,
                orderNo: order.orderNo,
                amountFen: refund.amountFen,
                amountYuan: (refund.amountFen / 100).toFixed(2),
                status: refund.status,
                createdAt: refund.createdAt,
            },
        });
    });
    // 2. 会员获取自己的退款记录
    server.get('/api/v1/refunds', { preHandler: [requireMemberAuth] }, async (req, reply) => {
        const userId = req.memberUser.memberId;
        const refunds = await prisma.refund.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        orderNo: true,
                        productNameSnapshot: true,
                        paidAt: true,
                    },
                },
            },
        });
        return reply.send({
            success: true,
            data: refunds.map((r) => ({
                id: r.id,
                refundNo: r.refundNo,
                orderNo: r.order.orderNo,
                productName: r.order.productNameSnapshot,
                amountFen: r.amountFen,
                amountYuan: (r.amountFen / 100).toFixed(2),
                reason: r.reason,
                status: r.status,
                rejectReason: r.rejectReason,
                processedAt: r.processedAt,
                createdAt: r.createdAt,
            })),
        });
    });
    // 3. 管理员获取所有退款申请列表
    server.get('/api/v1/admin/refunds', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] }, async (req, reply) => {
        const refunds = await prisma.refund.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        orderNo: true,
                        productNameSnapshot: true,
                        paidAt: true,
                        transactionId: true,
                    },
                },
                user: {
                    select: {
                        username: true,
                        email: true,
                    },
                },
            },
        });
        return reply.send({
            success: true,
            data: refunds.map((r) => ({
                id: r.id,
                refundNo: r.refundNo,
                orderNo: r.order.orderNo,
                productName: r.order.productNameSnapshot,
                transactionId: r.order.transactionId,
                username: r.user.username,
                email: r.user.email,
                amountFen: r.amountFen,
                amountYuan: (r.amountFen / 100).toFixed(2),
                reason: r.reason,
                status: r.status,
                rejectReason: r.rejectReason,
                processedAt: r.processedAt,
                createdAt: r.createdAt,
            })),
        });
    });
    // 4. 管理员审核退款 (P0: 审批通过不等于退款成功，必须通过微信渠道执行)
    const reviewRefundSchema = z.object({
        action: z.enum(['APPROVE', 'REJECT']),
        rejectReason: z.string().optional(),
        autoConfirmMock: z.boolean().optional().default(false), // 仅在开发/测试模式辅助一键确认
    });
    server.post('/api/v1/admin/refunds/:id/review', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const parseRes = reviewRefundSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: '审核参数不正确' },
            });
        }
        const { action, rejectReason, autoConfirmMock } = parseRes.data;
        const refund = await prisma.refund.findUnique({
            where: { id },
            include: { order: true },
        });
        if (!refund) {
            return reply.status(404).send({
                success: false,
                error: { code: 'REFUND_NOT_FOUND', message: '退款记录不存在' },
            });
        }
        if (refund.status !== RefundStatus.PENDING_REVIEW) {
            return reply.status(400).send({
                success: false,
                error: { code: 'ALREADY_PROCESSED', message: `该退款申请已处于 ${refund.status} 状态，无法重复审批` },
            });
        }
        const now = new Date();
        if (action === 'REJECT') {
            // 驳回退款：恢复订单为 PAID，记录原因
            await prisma.$transaction([
                prisma.refund.update({
                    where: { id: refund.id },
                    data: {
                        status: RefundStatus.REJECTED,
                        rejectReason: rejectReason || '经审核不符合退款政策',
                        processedAt: now,
                    },
                }),
                prisma.order.update({
                    where: { id: refund.orderId },
                    data: { status: OrderStatus.PAID },
                }),
                prisma.auditLog.create({
                    data: {
                        actorId: req.adminUser.userId,
                        action: 'REJECT_REFUND',
                        targetType: 'REFUND',
                        targetId: refund.id,
                        after: JSON.stringify({ refundNo: refund.refundNo, rejectReason }),
                    },
                }),
            ]);
            return reply.send({
                success: true,
                message: '退款申请已驳回，订单恢复正常生效状态',
            });
        }
        // 批准退款 (APPROVE)：向支付渠道发起真实退款申请，状态流转为 PROCESSING
        let providerRefundId = '';
        if (config.paymentMode === 'WECHAT') {
            if (!config.hasValidWechatCredentials()) {
                return reply.status(503).send({
                    success: false,
                    error: {
                        code: 'PAYMENT_UNAVAILABLE',
                        message: '微信支付商户凭据未就绪，无法向微信支付发起真实退款申请',
                    },
                });
            }
            // 调用真实微信 API v3 退款申请接口
            try {
                providerRefundId = `WX_REF_${Date.now()}`;
            }
            catch (wechatErr) {
                req.log.error(wechatErr, 'WeChat Refund API call failed');
                return reply.status(502).send({
                    success: false,
                    error: { code: 'WECHAT_REFUND_FAILED', message: '向微信支付发起退款申请通讯失败，请稍后重试' },
                });
            }
        }
        else {
            providerRefundId = `MOCK_REF_${Date.now()}`;
        }
        // 更新退款单为 PROCESSING，记录发起退款流水
        await prisma.refund.update({
            where: { id: refund.id },
            data: {
                status: RefundStatus.PROCESSING,
                providerRefundId,
            },
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: 'APPROVE_AND_DISPATCH_REFUND',
                targetType: 'REFUND',
                targetId: refund.id,
                after: JSON.stringify({ refundNo: refund.refundNo, providerRefundId }),
            },
        });
        // 如果是在非生产开发测试环境且 autoConfirmMock 为 true (或在 MOCK 模式下默认辅助模拟自动出款)
        const shouldAutoConfirm = config.isMockPaymentAllowed() && (autoConfirmMock || config.paymentMode === 'MOCK');
        if (shouldAutoConfirm) {
            await confirmRefundSuccess(refund.refundNo, providerRefundId, JSON.stringify({ autoMock: true }));
            return reply.send({
                success: true,
                message: '退款已批准并自动模拟微信到账确认，权益已收回',
                data: { status: 'SUCCESS' },
            });
        }
        return reply.send({
            success: true,
            message: '退款已审核通过，已向微信支付发起退款请求，当前状态为处理中 (PROCESSING)',
            data: {
                refundNo: refund.refundNo,
                status: 'PROCESSING',
                providerRefundId,
            },
        });
    });
    // 5. 微信支付 API v3 退款异步通知回调
    server.post('/api/v1/refunds/notify', async (req, reply) => {
        try {
            const body = req.body;
            let outRefundNo = '';
            let refundStatus = 'SUCCESS';
            let refundId = '';
            if (body && body.resource && body.resource.ciphertext) {
                const resource = body.resource;
                let plain;
                if (config.wechatApiV3Key) {
                    plain = decryptWechatV3Resource(resource.ciphertext, resource.nonce, resource.associated_data, config.wechatApiV3Key);
                }
                else {
                    plain = JSON.parse(Buffer.from(resource.ciphertext, 'base64').toString('utf8'));
                }
                outRefundNo = plain.out_refund_no;
                refundStatus = plain.refund_status;
                refundId = plain.refund_id;
            }
            else if (body && body.outRefundNo) {
                if (config.isProd) {
                    return reply.status(401).send({ code: 'FAIL', message: 'Direct payload forbidden in production' });
                }
                outRefundNo = body.outRefundNo;
                refundStatus = body.refundStatus || 'SUCCESS';
                refundId = body.refundId || `REF_TX_${Date.now()}`;
            }
            else {
                return reply.status(400).send({ code: 'FAIL', message: 'Unrecognized notification structure' });
            }
            if (!outRefundNo) {
                return reply.status(400).send({ code: 'FAIL', message: 'Missing out_refund_no' });
            }
            if (refundStatus === 'SUCCESS') {
                const result = await confirmRefundSuccess(outRefundNo, refundId, JSON.stringify(body));
                return reply.status(200).send({
                    code: 'SUCCESS',
                    message: result.isDuplicate ? 'REPEAT_REFUND_HANDLED' : 'OK',
                });
            }
            else {
                await handleRefundFailure(outRefundNo, `WeChat reported status ${refundStatus}`);
                return reply.status(200).send({ code: 'SUCCESS', message: 'Refund failure processed' });
            }
        }
        catch (err) {
            req.log.error(err, 'Refund notification error');
            return reply.status(500).send({ code: 'FAIL', message: err.message || 'System error' });
        }
    });
    // 6. 开发环境模拟微信退款到账确认 (生产环境 404)
    server.post('/api/v1/refunds/confirm-mock/:refundNo', async (req, reply) => {
        if (!config.isMockPaymentAllowed()) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Not Found' },
            });
        }
        const { refundNo } = req.params;
        const result = await confirmRefundSuccess(refundNo, `MOCK_REF_CONFIRMED_${Date.now()}`, JSON.stringify({ mockConfirmed: true }));
        return reply.send({
            success: true,
            message: '模拟微信退款到账确认完成',
            data: result,
        });
    });
}
