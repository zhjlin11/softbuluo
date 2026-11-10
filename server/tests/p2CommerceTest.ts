import { buildApp } from '../src/app';
import { prisma } from '../src/db';
import { FastifyInstance } from 'fastify';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 开始执行软游部落 P2 商业化与支付闭环集成测试');
  console.log('====================================================\n');

  let server: FastifyInstance | null = null;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (extra) console.error('     Detail:', extra);
      failedCount++;
    }
  }

  try {
    server = await buildApp();
    await server.ready();

    // ----------------------------------------------------
    // 测试 1: 验证商品数据初始化与价格分制存储
    // ----------------------------------------------------
    console.log('【阶段 1: 商品库与价格防篡改】');
    const productsRes = await server.inject({
      method: 'GET',
      url: '/api/v1/products',
    });
    const productsBody = JSON.parse(productsRes.payload);
    assert(productsRes.statusCode === 200 && productsBody.success === true, '1.1 公开商品列表接口正常响应');
    
    const monthlyVip = productsBody.data.find((p: any) => p.slug === 'monthly-vip');
    const singleService = productsBody.data.find((p: any) => p.slug === 'single-service');
    const yearlyVip = productsBody.data.find((p: any) => p.slug === 'yearly-vip');

    assert(!!monthlyVip && monthlyVip.priceFen === 1990 && monthlyVip.priceYuan === '19.90', '1.2 月度会员价格为 1990 分 (¥19.90)');
    assert(!!singleService && singleService.priceFen === 290, '1.3 单次服务价格为 290 分 (¥2.90)');
    assert(!!yearlyVip && yearlyVip.priceFen === 9900, '1.4 年度会员价格为 9900 分 (¥99.00)');

    // ----------------------------------------------------
    // 测试 2: 会员注册、登录与密码鉴权
    // ----------------------------------------------------
    console.log('\n【阶段 2: 会员注册与账号隔离体系】');
    const testEmail = `test_vip_${Date.now()}@softbuluo.com`;
    const testUsername = `vip_user_${Date.now().toString().slice(-4)}`;
    const testPassword = 'Password2026!';

    // 注册会员
    const regRes = await server.inject({
      method: 'POST',
      url: '/api/v1/members/register',
      payload: {
        username: testUsername,
        email: testEmail,
        password: testPassword,
      },
    });
    const regBody = JSON.parse(regRes.payload);
    assert(regRes.statusCode === 201 && regBody.success === true, '2.1 新会员成功注册', regBody);
    const memberCookie = regRes.headers['set-cookie'] as string;
    const testMemberId = regBody.data.member.id;

    // 查重测试
    const dupRes = await server.inject({
      method: 'POST',
      url: '/api/v1/members/register',
      payload: {
        username: testUsername,
        email: `another_${Date.now()}@softbuluo.com`,
        password: testPassword,
      },
    });
    assert(dupRes.statusCode === 409, '2.2 重复用户名注册被安全拦截 (409)');

    // 登录会员
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/members/login',
      payload: {
        account: testEmail,
        password: testPassword,
      },
    });
    const loginBody = JSON.parse(loginRes.payload);
    assert(loginRes.statusCode === 200 && loginBody.data.isVip === false, '2.3 会员成功登录，初始 VIP 状态为 false');

    // 个人中心接口
    const meRes = await server.inject({
      method: 'GET',
      url: '/api/v1/members/me',
      headers: { cookie: memberCookie },
    });
    const meBody = JSON.parse(meRes.payload);
    assert(meRes.statusCode === 200 && meBody.data.member.email === testEmail, '2.4 成功读取会员中心资料');

    // ----------------------------------------------------
    // 测试 3: 订单创建与价格快照计算
    // ----------------------------------------------------
    console.log('\n【阶段 3: 订单创建与服务端金额锁定】');
    const orderRes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: memberCookie },
      payload: {
        productId: monthlyVip.id,
        quantity: 1,
      },
    });
    const orderBody = JSON.parse(orderRes.payload);
    assert(orderRes.statusCode === 201 && orderBody.success === true, '3.1 成功创建月度会员订单');
    assert(orderBody.data.totalAmountFen === 1990 && orderBody.data.status === 'PENDING_PAYMENT', '3.2 服务端严格锁定 1990 分，状态为待支付');
    const orderNo1 = orderBody.data.orderNo;
    assert(orderNo1.startsWith('ORD'), '3.3 订单号具备 ORD 业务唯一规范前缀');

    // ----------------------------------------------------
    // 测试 4: 模拟支付与 10 次重复回调幂等性排重
    // ----------------------------------------------------
    console.log('\n【阶段 4: 支付回调、权益发放与 10 次重复回调严格幂等】');
    const payRes1 = await server.inject({
      method: 'POST',
      url: `/api/v1/payments/mock-pay/${orderNo1}`,
    });
    const payBody1 = JSON.parse(payRes1.payload);
    assert(payRes1.statusCode === 200 && payBody1.data.status === 'PAID', '4.1 首次支付完成，订单状态流转为 PAID');

    // 连续触发 10 次重复支付通知/调用
    console.log('     * 模拟高并发或网络抖动重发 10 次微信支付通知...');
    let allDuplicatesHandled = true;
    for (let i = 0; i < 10; i++) {
      const repeatRes = await server.inject({
        method: 'POST',
        url: `/api/v1/payments/mock-pay/${orderNo1}`,
      });
      const repeatBody = JSON.parse(repeatRes.payload);
      if (repeatRes.statusCode !== 200 || !repeatBody.data?.isDuplicate) {
        allDuplicatesHandled = false;
      }
    }
    assert(allDuplicatesHandled, '4.2 连续 10 次重复支付通知均安全拦截，全部返回 isDuplicate: true');

    // 验证在数据库中该订单仅发放了 1 个有效权益
    const entitlementsOrder1 = await prisma.entitlement.findMany({
      where: { orderId: (await prisma.order.findUnique({ where: { orderNo: orderNo1 } }))!.id },
    });
    assert(entitlementsOrder1.length === 1, `4.3 订单 1 最终严格仅生成 1 条权益记录 (实际: ${entitlementsOrder1.length})`);
    const vip1Expire = entitlementsOrder1[0].expiresAt!;
    assert(vip1Expire > new Date(), '4.4 会员权益已生效，且有效期在未来');

    // ----------------------------------------------------
    // 测试 5: 会员续费时长顺延叠加 (连续购买累加 365 天)
    // ----------------------------------------------------
    console.log('\n【阶段 5: 会员续费时长顺延叠加机制】');
    const orderRes2 = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: memberCookie },
      payload: {
        productId: yearlyVip.id,
        quantity: 1,
      },
    });
    const orderNo2 = JSON.parse(orderRes2.payload).data.orderNo;

    // 支付第二单 (年度会员 365 天)
    await server.inject({
      method: 'POST',
      url: `/api/v1/payments/mock-pay/${orderNo2}`,
    });

    // 重新查验用户会员总时长
    const meRes2 = await server.inject({
      method: 'GET',
      url: '/api/v1/members/me',
      headers: { cookie: memberCookie },
    });
    const meBody2 = JSON.parse(meRes2.payload);
    assert(meBody2.data.isVip === true, '5.1 会员状态正常保持激活');
    
    const finalVipExpire = new Date(meBody2.data.vipExpiresAt);
    const diffDays = Math.round((finalVipExpire.getTime() - Date.now()) / (24 * 3600 * 1000));
    assert(diffDays >= 390 && diffDays <= 396, `5.2 月度(30天) + 年度(365天) 成功顺延叠加，剩余约 ${diffDays} 天 (预期 ~395天)`);

    // ----------------------------------------------------
    // 测试 6: 官方外部下载外链 100% 免费直达
    // ----------------------------------------------------
    console.log('\n【阶段 6: 官方外部来源永久免费直达测试】');
    const officialSoftware = await prisma.software.findFirst({
      where: { status: 'PUBLISHED' },
      include: {
        versions: {
          include: {
            downloadSources: {
              where: { sourceType: 'OFFICIAL_EXTERNAL' },
            },
          },
        },
      },
    });

    if (officialSoftware && officialSoftware.versions[0]?.downloadSources[0]) {
      const source = officialSoftware.versions[0].downloadSources[0];
      const directRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/authorize',
        payload: {
          softwareId: officialSoftware.id,
          sourceId: source.id,
        },
      });
      const directBody = JSON.parse(directRes.payload);
      assert(directRes.statusCode === 200 && directBody.data.isOfficialExternal === true, '6.1 官方外链下载无需付费、无需登录，直接授权');
      assert(directBody.data.directUrl === source.url, '6.2 官方外链直达原厂开发者真实官网');
    } else {
      console.log('     (跳过 6.1: 无官方外链资源)');
    }

    // ----------------------------------------------------
    // 测试 7: 授权/托管资源鉴权、短时令牌签发与消费
    // ----------------------------------------------------
    console.log('\n【阶段 7: 授权托管资源鉴权与 120 秒短时令牌保护】');
    // 创建一个受限的测试托管下载源
    const testVersion = officialSoftware?.versions[0];
    if (testVersion) {
      const hostedSource = await prisma.downloadSource.create({
        data: {
          versionId: testVersion.id,
          sourceType: 'LICENSED_HOSTED',
          sourceName: '软游高速云加速专属源',
          url: 'https://cdn.softbuluo.com/licensed/test_package.zip',
          isActive: true,
          verificationStatus: 'VERIFIED',
        },
      });

      // 7.1 VIP 用户直接授权
      const vipAuthRes = await server.inject({
        method: 'POST',
        url: '/api/v1/downloads/authorize',
        headers: { cookie: memberCookie },
        payload: {
          softwareId: officialSoftware.id,
          sourceId: hostedSource.id,
        },
      });
      const vipAuthBody = JSON.parse(vipAuthRes.payload);
      assert(vipAuthRes.statusCode === 200 && !!vipAuthBody.data.downloadToken, '7.1 VIP 会员成功签发专属短时下载 Token');
      const token = vipAuthBody.data.downloadToken;

      // 7.2 消费 Token 下载文件
      const fileRes = await server.inject({
        method: 'GET',
        url: `/api/v1/downloads/file?token=${token}`,
      });
      assert(fileRes.statusCode === 200, '7.2 使用短时 Token 成功拉取文件流');

      // 7.3 重复使用已消费 Token 应当被安全拦截
      const repeatFileRes = await server.inject({
        method: 'GET',
        url: `/api/v1/downloads/file?token=${token}`,
      });
      assert(repeatFileRes.statusCode === 403, '7.3 已被消费的单次 Token 再次请求被安全拒绝 (403)');

      // 清理临时测试下载源
      await prisma.downloadSource.delete({ where: { id: hostedSource.id } });
    }

    // ----------------------------------------------------
    // 测试 8: 退款申请与管理员审核闭环 (自动收回权益)
    // ----------------------------------------------------
    console.log('\n【阶段 8: 退款申请、管理员审核与权益自动收回】');
    // 注册退款测试会员
    const refundUserEmail = `refund_${Date.now()}@softbuluo.com`;
    const regRefundRes = await server.inject({
      method: 'POST',
      url: '/api/v1/members/register',
      payload: {
        username: `refund_${Date.now().toString().slice(-4)}`,
        email: refundUserEmail,
        password: 'Password2026!',
      },
    });
    const refundUserCookie = regRefundRes.headers['set-cookie'] as string;

    // 创建单次服务订单并支付
    const singleOrderRes = await server.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie: refundUserCookie },
      payload: {
        productId: singleService.id,
        quantity: 1,
      },
    });
    const refundOrderNo = JSON.parse(singleOrderRes.payload).data.orderNo;
    await server.inject({
      method: 'POST',
      url: `/api/v1/payments/mock-pay/${refundOrderNo}`,
    });

    // 提交退款
    const refundApplyRes = await server.inject({
      method: 'POST',
      url: '/api/v1/refunds',
      headers: { cookie: refundUserCookie },
      payload: {
        orderNo: refundOrderNo,
        reason: '因本地操作系统版本不匹配，请求退款',
      },
    });
    const refundApplyBody = JSON.parse(refundApplyRes.payload);
    assert(refundApplyRes.statusCode === 201 && refundApplyBody.success === true, '8.1 会员成功发起退款申请');

    // 登录管理员账号进行审核
    const adminLoginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: {
        identifier: 'superadmin',
        password: 'Admin@123456',
      },
    });
    const adminCookie = adminLoginRes.headers['set-cookie'] as string;

    // 管理员获取退款列表并审核
    const adminRefundList = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/refunds',
      headers: { cookie: adminCookie },
    });
    const refundTarget = JSON.parse(adminRefundList.payload).data.find(
      (r: any) => r.orderNo === refundOrderNo
    );
    assert(!!refundTarget, '8.2 管理员成功在后台检索到该笔待审核退款');

    // 审核通过
    const reviewRes = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/refunds/${refundTarget.id}/review`,
      headers: { cookie: adminCookie },
      payload: { action: 'APPROVE' },
    });
    assert(reviewRes.statusCode === 200, '8.3 管理员审核通过退款');

    // 验证退款后订单与权益状态
    const refundedOrder = await prisma.order.findUnique({
      where: { orderNo: refundOrderNo },
      include: { entitlements: true },
    });
    assert(refundedOrder?.status === 'REFUNDED', '8.4 订单状态正式流转为 REFUNDED');
    assert(refundedOrder?.entitlements[0]?.status === 'REVOKED', '8.5 关联发放的权益已同步变更为 REVOKED (已收回)');

    console.log('\n====================================================');
    console.log(`🎉 测试执行完成! 通过: ${passedCount} 项, 失败: ${failedCount} 项`);
    console.log('====================================================');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('测试异常崩溃:', err);
    process.exit(1);
  } finally {
    if (server) await server.close();
  }
}

runTests();
