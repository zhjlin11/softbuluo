/**
 * 软游部落 P2.1 支付安全加固与上线前审计专项验收测试套件
 * 
 * 覆盖 8 大核心安全验收维度：
 * 1. 生产环境安全策略与 MOCK 模式物理隔离
 * 2. 50 次高并发网络抖动重发下的支付幂等性与权益单次发放
 * 3. 15分钟超时关单与真实扣款延迟到达的自动恢复与对账
 * 4. 微信支付通知伪造签名、金额篡改、重放攻击拦截
 * 5. 退款状态机渠道解耦与多笔续费订单精准退费权益收回
 * 6. 120秒高熵短时下载令牌、SHA-256哈希防泄漏、20次并发原子消费竞争防刷与配额故障补偿
 * 7. 对账异常自动探测与闭环修复
 * 8. 支付通知报文敏感私钥与个人 PII 脱敏保护
 */

import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import crypto from 'crypto';
import { generateOrderNo, hashDownloadToken } from '../src/utils/security';
import { processPaymentSuccess } from '../src/modules/payments/paymentService';
import { confirmRefundSuccess } from '../src/modules/refunds/refundService';
import { reconcileExpiredOrders, detectAnomalies } from '../src/modules/orders/reconciliationService';
import { config, validateEnvironmentSecurity } from '../src/config';
import { OrderStatus, EntitlementStatus, RefundStatus, ProductType, EntitlementType } from '@prisma/client';

async function runSecurityAcceptance() {
  console.log('================================================================');
  console.log('🛡️  开始执行软游部落 P2.1 支付安全加固与上线前审计专项验收套件');
  console.log('================================================================\n');

  const server = await buildApp();
  await server.ready();

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string) {
    if (cond) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // 预检依赖商品
  const monthlyProduct = await prisma.product.findUniqueOrThrow({ where: { slug: 'monthly-vip' } });
  const yearlyProduct = await prisma.product.findUniqueOrThrow({ where: { slug: 'yearly-vip' } });
  const singleProduct = await prisma.product.findUniqueOrThrow({ where: { slug: 'single-service' } });



  if (!monthlyProduct || !yearlyProduct || !singleProduct) {
    throw new Error('缺少基础测试商品数据，请先执行种子数据导入');
  }

  // 创建本次专用测试会员
  const testUserEmail = `sec_p21_${Date.now()}@softbuluo.com`;
  const regRes = await server.inject({
    method: 'POST',
    url: '/api/v1/members/register',
    payload: {
      username: `sec_${Date.now().toString().slice(-6)}`,
      email: testUserEmail,
      password: 'SecPassword2026!',
    },
  });
  const memberCookie = regRes.headers['set-cookie'] as string;
  const userRecord = await prisma.memberUser.findUniqueOrThrow({ where: { email: testUserEmail } });

  // --------------------------------------------------------------------------
  // 维度 1: 生产环境安全隔离与凭据缺失拦截
  // --------------------------------------------------------------------------
  console.log('【维度 1: 生产环境安全隔离与商户凭据安全校验】');
  {
    // 1.1 校验 validateEnvironmentSecurity 在生产模式下缺失配置时的拦截
    const originalAppEnv = config.appEnv;
    const originalPaymentMode = config.paymentMode;
    let thrownError = false;

    try {
      // 模拟进入生产环境但依然使用 MOCK 支付
      (config as any).appEnv = 'production';
      (config as any).paymentMode = 'MOCK';
      validateEnvironmentSecurity();
    } catch (err: any) {
      thrownError = true;
      assert(err.message.includes('strictly forbids PAYMENT_MODE=MOCK'), '1.1 生产环境开启 MOCK 支付被系统级致命错误拦截');
    } finally {
      (config as any).appEnv = originalAppEnv;
      (config as any).paymentMode = originalPaymentMode;
    }
    assert(thrownError, '1.2 生产环境安全校验器生效保证');

    // 1.3 验证在未就绪凭据时请求 Native 支付返回 503，严禁静默签发
    const tempOrderRes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: memberCookie },
      payload: { productId: monthlyProduct.id, quantity: 1 },
    });
    const tempOrderNo = JSON.parse(tempOrderRes.payload).data.orderNo;

    // 强行把模式切到 WECHAT 并置空凭据测试
    (config as any).paymentMode = 'WECHAT';
    const originalMch = config.wechatMchId;
    (config as any).wechatMchId = ''; // 模拟商户号未配置

    const nativeRes = await server.inject({
      method: 'POST',
      url: `/api/v1/payments/native/${tempOrderNo}`,
      headers: { cookie: memberCookie },
    });
    const nativeBody = JSON.parse(nativeRes.payload);
    assert(nativeRes.statusCode === 503 && nativeBody.error?.code === 'PAYMENT_UNAVAILABLE', '1.3 微信凭据缺失时 Native 接口返回 503，严禁回退 MOCK 冒充真实支付');

    // 还原环境
    (config as any).paymentMode = 'MOCK';
    (config as any).wechatMchId = originalMch;
  }


  // --------------------------------------------------------------------------
  // 维度 2: 真正 50 次高并发支付通知幂等与权益单次发放
  // --------------------------------------------------------------------------
  console.log('\n【维度 2: 50 次真实并发支付通知防重与幂等入账】');
  {
    const orderRes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: memberCookie },
      payload: { productId: monthlyProduct.id, quantity: 1 },
    });
    const orderNo = JSON.parse(orderRes.payload).data.orderNo;
    const txId = `WX_CONCURRENT_${Date.now()}`;

    // 使用 Promise.all 真正并发 50 次请求同时冲击 processPaymentSuccess
    const concurrentRequests = Array.from({ length: 50 }, (_, i) =>
      processPaymentSuccess(orderNo, txId, JSON.stringify({ index: i, transactionId: txId }))
    );

    const results = await Promise.all(concurrentRequests);
    const nonDuplicates = results.filter((r) => r.isDuplicate === false);
    const duplicates = results.filter((r) => r.isDuplicate === true);

    assert(nonDuplicates.length === 1, `2.1 50 次高并发冲击下，仅有 1 次有效流转入账 (实际: ${nonDuplicates.length})`);
    assert(duplicates.length === 49, `2.2 其余 49 次并发请求全部被幂等安全排重 (实际: ${duplicates.length})`);

    // 查验数据库中该订单对应发放的 Entitlement 记录有且仅有 1 条
    const dbOrder = await prisma.order.findUniqueOrThrow({
      where: { orderNo },
      include: { entitlements: true },
    });
    assert(dbOrder.entitlements.length === 1, '2.3 数据库物理级保障：同一订单绝对只产生 1 条会员权益记录');
    assert(dbOrder.status === OrderStatus.PAID, '2.4 订单最终状态准确为 PAID');
  }

  // --------------------------------------------------------------------------
  // 维度 3: 15 分钟超时关单与真实扣款延迟到达自动恢复
  // --------------------------------------------------------------------------
  console.log('\n【维度 3: 超时已关闭订单遇真实付款成功的自动恢复机制】');
  {
    // 创建一个已过期的 CLOSED 订单模拟
    const expiredOrder = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: userRecord.id,
        productId: monthlyProduct.id,
        productNameSnapshot: monthlyProduct.name,
        priceSnapshotFen: monthlyProduct.priceFen,
        totalAmountFen: monthlyProduct.priceFen,
        status: OrderStatus.CLOSED,
        expiresAt: new Date(Date.now() - 3600 * 1000), // 1 小时前已到期
        closedAt: new Date(Date.now() - 3500 * 1000),
      },
    });

    const lateTxId = `WX_LATE_PAY_${Date.now()}`;
    // 微信推送了该订单的已付款通知
    const recoveryResult = await processPaymentSuccess(
      expiredOrder.orderNo,
      lateTxId,
      JSON.stringify({ note: 'Late payment from WeChat gateway' })
    );

    assert(recoveryResult.recoveredFromClosed === true, '3.1 识别出属于超时已关单订单，触发自动恢复流程');

    const recoveredOrder = await prisma.order.findUniqueOrThrow({
      where: { id: expiredOrder.id },
      include: { entitlements: true },
    });
    assert(recoveredOrder.status === OrderStatus.PAID, '3.2 超时关单成功自动翻转恢复为 PAID');
    assert(recoveredOrder.entitlements.length === 1, '3.3 补发对应的合法会员权益，用户资金不掉单');
  }

  // --------------------------------------------------------------------------
  // 维度 4: 微信支付通知安全防御（时间戳防重放、金额篡改、伪造签名）
  // --------------------------------------------------------------------------
  console.log('\n【维度 4: 微信支付通知防篡改、防重放攻击与签名校验】');
  {
    // 4.1 模拟超时重放攻击 (Timestamp > 300 秒前)
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 分钟前
    const replayRes = await server.inject({
      method: 'POST',
      url: '/api/v1/payments/notify',
      headers: {
        'wechatpay-timestamp': String(oldTimestamp),
        'wechatpay-nonce': 'fake_nonce',
        'wechatpay-signature': 'fake_signature',
        'wechatpay-serial': 'fake_serial',
      },
      payload: { id: 'evt_replay', event_type: 'TRANSACTION.SUCCESS' },
    });
    const replayBody = JSON.parse(replayRes.payload);
    assert(replayRes.statusCode === 400 && replayBody.code === 'FAIL' && replayBody.message.includes('expired'), '4.1 超过 300 秒的时间戳被防重放攻击拦截');

    // 4.2 模拟金额篡改攻击 (改价攻击)
    const testTamperOrder = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: userRecord.id,
        productId: monthlyProduct.id,
        productNameSnapshot: monthlyProduct.name,
        priceSnapshotFen: 1990,
        totalAmountFen: 1990,
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    const tamperRes = await server.inject({
      method: 'POST',
      url: '/api/v1/payments/notify',
      headers: {
        'wechatpay-timestamp': String(Math.floor(Date.now() / 1000)),
      },
      payload: {
        outTradeNo: testTamperOrder.orderNo,
        amountTotal: 100, // 恶意篡改为 1 元
        transactionId: `TX_TAMPER_${Date.now()}`,
      },
    });
    const tamperBody = JSON.parse(tamperRes.payload);
    assert(
      tamperRes.statusCode === 400 &&
        tamperBody.code === 'FAIL' &&
        tamperBody.message.toLowerCase().includes('amount mismatch'),
      '4.2 恶意篡改金额 (1990分篡改为100分) 被风控实时阻断拦截'
    );

    // 4.3 模拟伪造非法格式报文
    const invalidFormatRes = await server.inject({
      method: 'POST',
      url: '/api/v1/payments/notify',
      headers: {
        'wechatpay-timestamp': String(Math.floor(Date.now() / 1000)),
      },
      payload: { invalid_field: 'malicious_content' },
    });
    const invalidFormatBody = JSON.parse(invalidFormatRes.payload);
    assert(invalidFormatRes.statusCode === 400 && invalidFormatBody.code === 'FAIL', '4.3 非法伪造格式支付通知报文被安全拒绝 (400)');

    // 清理测试订单
    await prisma.order.delete({ where: { id: testTamperOrder.id } });
  }


  // --------------------------------------------------------------------------
  // 维度 5: 退款状态机渠道解耦与多笔续费订单精准退费权益收回
  // --------------------------------------------------------------------------
  console.log('\n【维度 5: 退款解耦与多笔续费订单精准回收测试】');
  {
    // 创建独立测试用户避免受到其他订单影响
    const multiUserEmail = `multi_ent_${Date.now()}@softbuluo.com`;
    const multiUserReg = await server.inject({
      method: 'POST',
      url: '/api/v1/members/register',
      payload: {
        username: `multi_${Date.now().toString().slice(-6)}`,
        email: multiUserEmail,
        password: 'Password2026!',
      },
    });
    const multiUserCookie = multiUserReg.headers['set-cookie'] as string;

    // 订单 A: 购买月度会员 (30 天) 并支付
    const orderARes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: multiUserCookie },
      payload: { productId: monthlyProduct.id, quantity: 1 },
    });
    const orderNoA = JSON.parse(orderARes.payload).data.orderNo;
    await processPaymentSuccess(orderNoA, `TX_A_${Date.now()}`);

    // 订单 B: 续费年度会员 (365 天) 并支付
    const orderBRes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: multiUserCookie },
      payload: { productId: yearlyProduct.id, quantity: 1 },
    });
    const orderNoB = JSON.parse(orderBRes.payload).data.orderNo;
    await processPaymentSuccess(orderNoB, `TX_B_${Date.now()}`);

    // 查验用户当前有 2 笔权益
    const orderA = await prisma.order.findUniqueOrThrow({ where: { orderNo: orderNoA }, include: { entitlements: true } });
    const orderB = await prisma.order.findUniqueOrThrow({ where: { orderNo: orderNoB }, include: { entitlements: true } });
    assert(orderA.entitlements[0].status === 'ACTIVE', '5.1 订单 A 月度会员权益生效中');
    assert(orderB.entitlements[0].status === 'ACTIVE', '5.2 订单 B 年度会员权益生效中');

    // 用户申请退订订单 B (365天)，发起退款
    const refundRes = await server.inject({
      method: 'POST',
      url: '/api/v1/refunds',
      headers: { cookie: multiUserCookie },
      payload: { orderNo: orderNoB, reason: '买错套餐，申请退订' },
    });
    const refundNo = JSON.parse(refundRes.payload).data.refundNo;

    // 渠道确认退款到账 SUCCESS
    await confirmRefundSuccess(refundNo, `WX_REFUND_${Date.now()}`);

    // 核心验证：订单 B 的权益被精准撤销 (REVOKED)，但订单 A 的 30 天权益依然必须有效！
    const refreshedEntA = await prisma.entitlement.findUniqueOrThrow({ where: { id: orderA.entitlements[0].id } });
    const refreshedEntB = await prisma.entitlement.findUniqueOrThrow({ where: { id: orderB.entitlements[0].id } });

    assert(refreshedEntB.status === 'REVOKED', '5.3 退款单 B 对应的 365 天年度权益被精确收回 (REVOKED)');
    assert(refreshedEntA.status === 'ACTIVE', '5.4 关键资产安全：订单 A 的月度会员权益完好无损保留 (ACTIVE)');

    // 5.5 超额退款拦截测试
    const overRefundRes = await server.inject({
      method: 'POST',
      url: '/api/v1/refunds',
      headers: { cookie: multiUserCookie },
      payload: { orderNo: orderNoA, reason: '测试超额退款', amountFen: 999999 },
    });
    const overRefundBody = JSON.parse(overRefundRes.payload);
    assert(
      overRefundRes.statusCode === 400 && overRefundBody.error?.code === 'EXCESSIVE_REFUND_AMOUNT',
      '5.5 申请退款金额超过订单支付总额被严格拦截 (400 EXCESSIVE_REFUND_AMOUNT)'
    );

  }

  // --------------------------------------------------------------------------
  // 维度 6: 120 秒短时令牌、哈希安全、20 次并发原子消费竞争与配额故障补偿
  // --------------------------------------------------------------------------
  console.log('\n【维度 6: 120 秒高熵令牌、哈希防泄漏与 20 次并发原子消费竞争防刷】');
  {
    // 获取一个测试软件
    const testSoftware = await prisma.software.findFirst({
      where: { status: 'PUBLISHED' },
      include: { versions: true },
    });

    if (testSoftware && testSoftware.versions[0]) {
      const v = testSoftware.versions[0];
      const mockHostedSource = await prisma.downloadSource.create({
        data: {
          versionId: v.id,
          sourceType: 'LICENSED_HOSTED',
          sourceName: '软游安全测试高速节点',
          url: 'https://cdn.softbuluo.com/licensed/security_test.zip',
          isActive: true,
          verificationStatus: 'VERIFIED',
        },
      });

      // 6.1 VIP 签发令牌
      const authRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/authorize',
        headers: { cookie: memberCookie },
        payload: { softwareId: testSoftware.id, sourceId: mockHostedSource.id },
      });
      const authBody = JSON.parse(authRes.payload);
      assert(authRes.statusCode === 200 && !!authBody.data.downloadToken, '6.1 成功签发 120 秒短时下载 Token');
      const token = authBody.data.downloadToken;

      // 6.2 数据库哈希检索验证
      const tokenHash = hashDownloadToken(token);
      const authLog = await prisma.downloadAuthorizationLog.findFirst({
        where: { tokenHash },
      });
      assert(authLog !== null && authLog.tokenHash === tokenHash, '6.2 数据库已保存 SHA-256 哈希值，防止库泄漏直接遍历');

      // 6.3 20 次并发原子消费竞争测试
      // 模拟多线程/下载工具同时使用同一个短时 Token 发起 20 次并发下载请求
      const consumeRequests = Array.from({ length: 20 }, () =>
        server.inject({
          method: 'GET',
          url: `/api/v1/downloads/file?token=${token}`,
        })
      );

      const consumeResponses = await Promise.all(consumeRequests);
      const success200 = consumeResponses.filter((r) => r.statusCode === 200);
      const consumed403 = consumeResponses.filter((r) => r.statusCode === 403);

      assert(success200.length === 1, `6.3 20 次高并发原子消费冲击下，仅且仅有 1 次成功下载 (实际: ${success200.length})`);
      assert(consumed403.length === 19, `6.4 其余 19 次并发全部被原子锁拦截为 403 TOKEN_CONSUMED (实际: ${consumed403.length})`);

      // 6.5 未购买资源拦截测试：新注册无权益会员请求下载受限源
      const freeMemberEmail = `free_${Date.now()}@softbuluo.com`;
      const freeReg = await server.inject({
        method: 'POST',
        url: '/api/v1/members/register',
        payload: {
          username: `free_${Date.now().toString().slice(-6)}`,
          email: freeMemberEmail,
          password: 'Password2026!',
        },
      });
      const freeCookie = freeReg.headers['set-cookie'] as string;

      const unauthDownloadRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/authorize',
        headers: { cookie: freeCookie },
        payload: { softwareId: testSoftware.id, sourceId: mockHostedSource.id },
      });
      assert(unauthDownloadRes.statusCode === 403, '6.5 无 VIP 且无单次配额的用户请求专属资源被安全拦截 (403)');

      // 6.6 下载故障配额补偿闭环测试
      // 为该普通用户发 1 次单次下载配额
      const freeUser = await prisma.memberUser.findUniqueOrThrow({ where: { email: freeMemberEmail } });
      const singleOrder = await prisma.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: freeUser.id,
          productId: singleProduct.id,
          productNameSnapshot: singleProduct.name,
          priceSnapshotFen: singleProduct.priceFen,
          totalAmountFen: singleProduct.priceFen,
          status: OrderStatus.PAID,
          expiresAt: new Date(Date.now() + 3600 * 1000),
          paidAt: new Date(),
        },
      });
      const singleEnt = await prisma.entitlement.create({
        data: {
          userId: freeUser.id,
          productId: singleProduct.id,
          orderId: singleOrder.id,
          entitlementType: EntitlementType.LICENSED_DOWNLOAD,
          quotaRemaining: 1,
          status: EntitlementStatus.ACTIVE,
        },
      });

      // 授权下载并扣减配额为 0
      const freeAuthRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/authorize',
        headers: { cookie: freeCookie },
        payload: { softwareId: testSoftware.id, sourceId: mockHostedSource.id },
      });
      const freeToken = JSON.parse(freeAuthRes.payload).data.downloadToken;

      // 消费 Token
      await server.inject({
        method: 'GET',
        url: `/api/v1/downloads/file?token=${freeToken}`,
      });

      const entBeforeComp = await prisma.entitlement.findUniqueOrThrow({ where: { id: singleEnt.id } });
      assert(entBeforeComp.quotaRemaining === 0, '6.6 配额已扣减至 0');

      // 模拟下载故障，调用配额补偿接口
      const compRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/compensate',
        headers: { cookie: freeCookie },
        payload: { downloadToken: freeToken, reason: '文件网络中断无法完成解压' },
      });
      const compBody = JSON.parse(compRes.payload);
      assert(compRes.statusCode === 200 && compBody.data.compensated === true, '6.7 15 分钟故障时效内成功为用户补回配额');

      const entAfterComp = await prisma.entitlement.findUniqueOrThrow({ where: { id: singleEnt.id } });
      assert(entAfterComp.quotaRemaining === 1 && entAfterComp.status === 'ACTIVE', '6.8 配额原子加回 1 且状态恢复为 ACTIVE');

      // 重复补偿应当被拦截
      const repeatCompRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/compensate',
        headers: { cookie: freeCookie },
        payload: { downloadToken: freeToken },
      });
      assert(repeatCompRes.statusCode === 400, '6.9 同一凭证重复补偿被安全拦截 (400)');

      // 清理测试下载源
      await prisma.downloadSource.delete({ where: { id: mockHostedSource.id } });
    }
  }

  // --------------------------------------------------------------------------
  // 维度 7: 对账异常自动探测与闭环修复
  // --------------------------------------------------------------------------
  console.log('\n【维度 7: 对账系统异常探测与自动修复】');
  {
    // 7.1 自动核销超时未支付订单
    const staleOrder = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: userRecord.id,
        productId: monthlyProduct.id,
        productNameSnapshot: monthlyProduct.name,
        priceSnapshotFen: monthlyProduct.priceFen,
        totalAmountFen: monthlyProduct.priceFen,
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: new Date(Date.now() - 3600 * 1000), // 已超时
      },
    });

    const reconcileResult = await reconcileExpiredOrders();
    assert(reconcileResult.closedCount >= 1, '7.1 对账引擎成功自动关闭超时未支付订单');

    const closedStaleOrder = await prisma.order.findUniqueOrThrow({ where: { id: staleOrder.id } });
    assert(closedStaleOrder.status === OrderStatus.CLOSED, '7.2 订单状态流转为 CLOSED');

    // 7.2 异常探测：故意制造一笔已支付但未发放权益的异常订单
    const anomalyOrder = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: userRecord.id,
        productId: monthlyProduct.id,
        productNameSnapshot: monthlyProduct.name,
        priceSnapshotFen: monthlyProduct.priceFen,
        totalAmountFen: monthlyProduct.priceFen,
        status: OrderStatus.PAID,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        paidAt: new Date(),
      },
    });

    const anomalies = await detectAnomalies();
    const foundAnomaly = anomalies.find((a) => a.orderNo === anomalyOrder.orderNo);
    assert(!!foundAnomaly && foundAnomaly.type === 'PAID_WITHOUT_ENTITLEMENT', '7.3 对账引擎准确识别出 PAID_WITHOUT_ENTITLEMENT 掉单异常');

    // 清理异常测试单
    await prisma.order.delete({ where: { id: anomalyOrder.id } });
  }

  // --------------------------------------------------------------------------
  // 维度 8: 支付流水脱敏与 PII 隐私合规
  // --------------------------------------------------------------------------
  console.log('\n【维度 8: 支付流水脱敏与 PII 隐私合规】');
  {
    const latestLogs = await prisma.paymentLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    let hasSensitiveLeak = false;
    for (const log of latestLogs) {
      const raw = log.rawNotification || '';
      if (raw.includes('apiv3_key') || raw.includes('PRIVATE KEY') || raw.includes('session=') || raw.includes('password')) {
        hasSensitiveLeak = true;
      }
    }
    assert(!hasSensitiveLeak, '8.1 支付通知审计流水 100% 无敏感密钥、密码与 Cookie 泄露');
  }

  console.log('\n================================================================');
  console.log(`🛡️  P2.1 安全验收执行完成: 通过 ${passed} 项, 失败 ${failed} 项`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAcceptance()
  .catch((e) => {
    console.error('Fatal error running security tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
