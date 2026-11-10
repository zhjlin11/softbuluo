import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { hashPassword, verifyPassword } from '../../utils/security';
import { requireMemberAuth, MemberSessionData } from '../../middleware/auth';
import { MemberStatus, EntitlementStatus, EntitlementType } from '@prisma/client';

export async function memberRoutes(server: FastifyInstance) {
  // 1. 会员注册
  const registerSchema = z.object({
    username: z
      .string()
      .min(3, '用户名至少需要3个字符')
      .max(20, '用户名不能超过20个字符')
      .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只允许字母、数字、下划线及中文'),
    email: z.string().email('邮箱格式不正确'),
    password: z
      .string()
      .min(8, '密码至少需要8位字符')
      .regex(/[a-zA-Z]/, '密码必须包含英文字母')
      .regex(/[0-9]/, '密码必须包含数字'),
  });

  server.post('/api/v1/members/register', async (req, reply) => {
    const parseRes = registerSchema.safeParse(req.body);
    if (!parseRes.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '注册信息格式不正确' },
      });
    }

    const { username, email, password } = parseRes.data;

    // 查重 (用户名或邮箱)
    const existing = await prisma.memberUser.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      const field = existing.email === email ? '邮箱' : '用户名';
      return reply.status(409).send({
        success: false,
        error: { code: 'DUPLICATE_USER', message: `该${field}已被注册，请直接登录` },
      });
    }

    const passwordHash = await hashPassword(password);

    const member = await prisma.memberUser.create({
      data: {
        username,
        email,
        passwordHash,
        status: MemberStatus.ACTIVE,
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // 写入独立 member session
    const sessionData: MemberSessionData = {
      memberId: member.id,
      username: member.username,
      email: member.email,
      status: member.status,
    };
    (req.session as any).member = sessionData;

    return reply.status(201).send({
      success: true,
      data: {
        member,
        isVip: false,
        vipExpiresAt: null,
      },
    });
  });

  // 2. 会员登录 (支持邮箱或用户名登录)
  const loginSchema = z.object({
    account: z.string().min(1, '请输入用户名或注册邮箱'),
    password: z.string().min(1, '请输入密码'),
  });

  server.post('/api/v1/members/login', async (req, reply) => {
    const parseRes = loginSchema.safeParse(req.body);
    if (!parseRes.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '请输入账号和密码' },
      });
    }

    const { account, password } = parseRes.data;

    const member = await prisma.memberUser.findFirst({
      where: {
        OR: [{ email: account }, { username: account }],
      },
    });

    if (!member) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '账号或密码错误' },
      });
    }

    if (member.status !== MemberStatus.ACTIVE) {
      return reply.status(403).send({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: '该账号已被冻结或封禁，请联系客服' },
      });
    }

    const isMatch = await verifyPassword(password, member.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: '账号或密码错误' },
      });
    }

    // 更新最后登录时间
    await prisma.memberUser.update({
      where: { id: member.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionData: MemberSessionData = {
      memberId: member.id,
      username: member.username,
      email: member.email,
      status: member.status,
    };
    (req.session as any).member = sessionData;

    // 查询当前会员权益与到期时间
    const now = new Date();
    const activeVipEntitlements = await prisma.entitlement.findMany({
      where: {
        userId: member.id,
        entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
        status: EntitlementStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
      take: 1,
    });

    const latestVip = activeVipEntitlements[0];

    return reply.send({
      success: true,
      data: {
        member: {
          id: member.id,
          username: member.username,
          email: member.email,
          status: member.status,
          avatarUrl: member.avatarUrl,
          createdAt: member.createdAt,
        },
        isVip: !!latestVip,
        vipExpiresAt: latestVip ? latestVip.expiresAt : null,
      },
    });
  });

  // 3. 会员登出
  server.post('/api/v1/members/logout', async (req, reply) => {
    (req.session as any).member = null;
    return reply.send({
      success: true,
      message: '已安全退出登录',
    });
  });

  // 4. 获取当前会员详情 (含 VIP 权益状态)
  server.get(
    '/api/v1/members/me',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const memberId = req.memberUser!.memberId;

      const member = await prisma.memberUser.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!member) {
        (req.session as any).member = null;
        return reply.status(401).send({
          success: false,
          error: { code: 'MEMBER_NOT_FOUND', message: '用户不存在' },
        });
      }

      const now = new Date();
      const activeVipEntitlements = await prisma.entitlement.findMany({
        where: {
          userId: member.id,
          entitlementType: EntitlementType.MEMBERSHIP_ACCESS,
          status: EntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
        orderBy: { expiresAt: 'desc' },
        take: 1,
      });

      const latestVip = activeVipEntitlements[0];

      // 查询有效单次/按资源权益总数
      const activeResourceEntitlementsCount = await prisma.entitlement.count({
        where: {
          userId: member.id,
          status: EntitlementStatus.ACTIVE,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ],
          quotaRemaining: { gt: 0 }
        }
      });

      return reply.send({
        success: true,
        data: {
          member,
          isVip: !!latestVip,
          vipExpiresAt: latestVip ? latestVip.expiresAt : null,
          activeEntitlementsCount: activeResourceEntitlementsCount + (latestVip ? 1 : 0),
        },
      });
    }
  );

  // 5. 修改密码
  const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, '请输入当前旧密码'),
    newPassword: z
      .string()
      .min(8, '新密码至少需要8位字符')
      .regex(/[a-zA-Z]/, '新密码必须包含英文字母')
      .regex(/[0-9]/, '新密码必须包含数字'),
  });

  server.post(
    '/api/v1/members/password',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const parseRes = changePasswordSchema.safeParse(req.body);
      if (!parseRes.success) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues[0]?.message || '密码格式不正确' },
        });
      }

      const { oldPassword, newPassword } = parseRes.data;
      const memberId = req.memberUser!.memberId;

      const member = await prisma.memberUser.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        return reply.status(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
        });
      }

      const isMatch = await verifyPassword(oldPassword, member.passwordHash);
      if (!isMatch) {
        return reply.status(400).send({
          success: false,
          error: { code: 'WRONG_OLD_PASSWORD', message: '当前旧密码不正确' },
        });
      }

      const newHash = await hashPassword(newPassword);
      await prisma.memberUser.update({
        where: { id: memberId },
        data: { passwordHash: newHash },
      });

      return reply.send({
        success: true,
        message: '密码修改成功，请妥善保管',
      });
    }
  );

  // 6. 获取当前会员所有权益明细
  server.get(
    '/api/v1/members/entitlements',
    { preHandler: [requireMemberAuth] },
    async (req, reply) => {
      const memberId = req.memberUser!.memberId;

      const entitlements = await prisma.entitlement.findMany({
        where: { userId: memberId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              name: true,
              productType: true,
              description: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: entitlements,
      });
    }
  );
}
