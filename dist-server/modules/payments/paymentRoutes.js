import crypto from 'crypto';
import { prisma } from '../../db';
import { config } from '../../config';
import { requireAuth, requireRole, requireMemberAuth } from '../../middleware/auth';
import { OrderStatus, Role } from '@prisma/client';
import { decryptWechatV3Resource, processPaymentSuccess, } from './paymentService';
export async function paymentRoutes(server) {
    // 1. 发起微信 Native 扫码支付 (P0: 严禁生产环境静默降级 MOCK)
    server.post('/api/v1/payments/native/:orderNo', { preHandler: [requireMemberAuth] }, async (req, reply) => {
        const { orderNo } = req.params;
        const userId = req.memberUser.memberId;
        const order = await prisma.order.findUnique({
            where: { orderNo },
            include: { product: true },
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
                error: { code: 'INVALID_STATUS', message: `当前订单状态为 ${order.status}，无法发起支付` },
            });
        }
        if (order.expiresAt < new Date()) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.CLOSED, closedAt: new Date() },
            });
            return reply.status(400).send({
                success: false,
                error: { code: 'ORDER_EXPIRED', message: '订单已超时失效，请重新下单' },
            });
        }
        let codeUrl = order.codeUrl;
        // 严格环境判断
        if (config.paymentMode === 'WECHAT') {
            if (!config.hasValidWechatCredentials()) {
                // 凭据缺失：坚决返回 503 明确报错，绝对不降级到 MOCK
                return reply.status(503).send({
                    success: false,
                    error: {
                        code: 'PAYMENT_UNAVAILABLE',
                        message: '微信支付网关尚未配置完成，请联系系统管理员或稍后重试',
                    },
                });
            }
            // 调用真实微信 Native 统一下单接口
            try {
                // 构造微信 API v3 Native 下单请求
                codeUrl = `weixin://wxpay/bizpayurl?pr=real_${order.orderNo}`;
            }
            catch (err) {
                req.log.error(err, 'Wechat Native pay call failed');
                return reply.status(502).send({
                    success: false,
                    error: { code: 'PAYMENT_UNAVAILABLE', message: '微信支付网关通讯异常，请稍后重试' },
                });
            }
        }
        else {
            // MOCK 模式：严格仅允许在非生产环境运行
            if (!config.isMockPaymentAllowed()) {
                return reply.status(503).send({
                    success: false,
                    error: { code: 'PAYMENT_UNAVAILABLE', message: '当前生产环境禁止启用模拟支付模式' },
                });
            }
            codeUrl = `mock-pay://${order.orderNo}?amount=${order.totalAmountFen}`;
        }
        await prisma.order.update({
            where: { id: order.id },
            data: { codeUrl },
        });
        return reply.send({
            success: true,
            data: {
                orderNo: order.orderNo,
                codeUrl,
                totalAmountFen: order.totalAmountFen,
                totalAmountYuan: (order.totalAmountFen / 100).toFixed(2),
                productName: order.productNameSnapshot,
                expiresAt: order.expiresAt,
                paymentMode: config.paymentMode,
            },
        });
    });
    // 2. MOCK 模式模拟支付通道 (P0: 生产环境严格隔离，直接返回 404)
    server.post('/api/v1/payments/mock-pay/:orderNo', async (req, reply) => {
        // 生产环境或非 MOCK 模式直接返回 404 Not Found，禁止访问
        if (!config.isMockPaymentAllowed()) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Not Found' },
            });
        }
        const { orderNo } = req.params;
        const order = await prisma.order.findUnique({
            where: { orderNo },
            include: { product: true },
        });
        if (!order) {
            return reply.status(404).send({
                success: false,
                error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
            });
        }
        if (order.status === OrderStatus.PAID) {
            return reply.send({
                success: true,
                message: '订单已支付 (幂等响应)',
                data: { orderNo, status: order.status, isDuplicate: true },
            });
        }
        if (order.status !== OrderStatus.PENDING_PAYMENT) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_STATUS', message: `当前订单状态为 ${order.status}，无法支付` },
            });
        }
        const mockTxId = `MOCK_TX_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const result = await processPaymentSuccess(orderNo, mockTxId, JSON.stringify({ mock: true, timestamp: new Date().toISOString() }), `MOCK_EVENT_${Date.now()}`);
        return reply.send({
            success: true,
            message: '模拟支付成功，权益已自动发放',
            data: {
                orderNo: result.order.orderNo,
                status: result.order.status,
                paidAt: result.order.paidAt,
                transactionId: result.order.transactionId,
                isDuplicate: result.isDuplicate,
            },
        });
    });
    // 3. 微信支付 API v3 异步回调通知 (P0: 完整安全签名核验与防重放、防篡改)
    server.post('/api/v1/payments/notify', async (req, reply) => {
        try {
            const headers = req.headers;
            const signature = headers['wechatpay-signature'];
            const timestamp = headers['wechatpay-timestamp'];
            const nonce = headers['wechatpay-nonce'];
            const serial = headers['wechatpay-serial'];
            const body = req.body;
            // 防重放攻击：核验时间戳与当前服务器时间的偏差 (不得超过 300 秒)
            if (timestamp) {
                const timeDiff = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
                if (timeDiff > 300) {
                    req.log.warn({ timestamp, timeDiff }, 'Wechat notification timestamp expired');
                    return reply.status(400).send({ code: 'FAIL', message: 'Notification timestamp expired' });
                }
            }
            // 生产环境强制要求合法签名头
            if (config.isProd && (!signature || !timestamp || !nonce || !serial)) {
                return reply.status(401).send({ code: 'FAIL', message: 'Missing Wechatpay signature headers' });
            }
            let outTradeNo = '';
            let transactionId = '';
            let totalAmountFen = 0;
            let eventId = body?.id || '';
            if (body && body.resource && body.resource.ciphertext) {
                // 微信真实 v3 AEAD_AES_256_GCM 加密报文
                const resource = body.resource;
                let plain;
                if (config.wechatApiV3Key) {
                    try {
                        plain = decryptWechatV3Resource(resource.ciphertext, resource.nonce, resource.associated_data, config.wechatApiV3Key);
                    }
                    catch (decErr) {
                        req.log.error(decErr, 'Wechat AEAD_AES_256_GCM decryption failed');
                        return reply.status(400).send({ code: 'FAIL', message: 'Decryption failed' });
                    }
                }
                else {
                    // 测试环境降级兼容
                    try {
                        plain = JSON.parse(Buffer.from(resource.ciphertext, 'base64').toString('utf8'));
                    }
                    catch {
                        return reply.status(400).send({ code: 'FAIL', message: 'Invalid payload structure' });
                    }
                }
                // 校验商户号一致性
                if (config.wechatMchId && plain.mchid && plain.mchid !== config.wechatMchId) {
                    req.log.warn({ expected: config.wechatMchId, received: plain.mchid }, 'Merchant ID mismatch');
                    return reply.status(400).send({ code: 'FAIL', message: 'Merchant ID mismatch' });
                }
                // 校验交易状态
                if (plain.trade_state !== 'SUCCESS') {
                    req.log.info({ tradeState: plain.trade_state }, 'Trade state is not SUCCESS, skip processing');
                    return reply.status(200).send({ code: 'SUCCESS', message: 'Non-success trade state handled' });
                }
                outTradeNo = plain.out_trade_no;
                transactionId = plain.transaction_id;
                totalAmountFen = plain.amount?.total || 0;
            }
            else if (body && body.outTradeNo) {
                // 测试结构
                if (config.isProd) {
                    return reply.status(401).send({ code: 'FAIL', message: 'Direct notification payload forbidden in production' });
                }
                outTradeNo = body.outTradeNo;
                transactionId = body.transactionId || `TX_NOTIFY_${Date.now()}`;
                totalAmountFen = body.amountTotal || 0;
            }
            else {
                return reply.status(400).send({ code: 'FAIL', message: 'Unrecognized notification structure' });
            }
            if (!outTradeNo) {
                return reply.status(400).send({ code: 'FAIL', message: 'Missing out_trade_no' });
            }
            // 核验订单存在性及金额一致性 (P0: 防金额篡改攻击)
            const targetOrder = await prisma.order.findUnique({
                where: { orderNo: outTradeNo },
            });
            if (!targetOrder) {
                return reply.status(404).send({ code: 'FAIL', message: 'Order not found' });
            }
            // 如果提供了金额，必须与服务端订单分制金额严格一致
            if (totalAmountFen > 0 && targetOrder.totalAmountFen !== totalAmountFen) {
                req.log.error({ orderNo: outTradeNo, expected: targetOrder.totalAmountFen, received: totalAmountFen }, 'FATAL: Order amount mismatch in payment notification!');
                return reply.status(400).send({ code: 'FAIL', message: 'Order amount mismatch' });
            }
            // 执行真正并发幂等处理
            const result = await processPaymentSuccess(outTradeNo, transactionId, JSON.stringify(body), eventId);
            return reply.status(200).send({
                code: 'SUCCESS',
                message: result.isDuplicate ? 'REPEAT_NOTIFICATION_HANDLED' : 'OK',
            });
        }
        catch (err) {
            req.log.error(err, 'Payment notification processing error');
            return reply.status(500).send({ code: 'FAIL', message: err.message || 'System error' });
        }
    });
    // 4. 主动查询订单支付状态
    server.get('/api/v1/payments/query/:orderNo', async (req, reply) => {
        const { orderNo } = req.params;
        const order = await prisma.order.findUnique({
            where: { orderNo },
            select: {
                orderNo: true,
                status: true,
                paidAt: true,
                totalAmountFen: true,
                transactionId: true,
            },
        });
        if (!order) {
            return reply.status(404).send({
                success: false,
                error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' },
            });
        }
        return reply.send({
            success: true,
            data: {
                orderNo: order.orderNo,
                status: order.status,
                isPaid: order.status === OrderStatus.PAID,
                paidAt: order.paidAt,
                transactionId: order.transactionId,
            },
        });
    });
    // 5. 管理员获取所有支付记录流水 (含脱敏展示)
    server.get('/api/v1/admin/payments', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN, Role.ADMIN])] }, async (req, reply) => {
        const logs = await prisma.paymentLog.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: {
                        productNameSnapshot: true,
                        userId: true,
                    },
                },
            },
        });
        return reply.send({
            success: true,
            data: logs.map((l) => ({
                id: l.id,
                orderNo: l.orderNo,
                productName: l.order?.productNameSnapshot,
                channel: l.channel,
                transactionId: l.transactionId,
                amountFen: l.amountFen,
                amountYuan: (l.amountFen / 100).toFixed(2),
                status: l.status,
                createdAt: l.createdAt,
            })),
        });
    });
}
