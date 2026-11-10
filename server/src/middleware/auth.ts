import { FastifyRequest, FastifyReply } from 'fastify';
import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../db';

export interface AuthSessionData {
  userId: string;
  username: string;
  email: string;
  role: Role;
  tokenVersion?: number;
}

export interface MemberSessionData {
  memberId: string;
  username: string;
  email: string;
  status: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    adminUser?: AuthSessionData;
    memberUser?: MemberSessionData;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  // 从 session 获取管理员登录态
  const session = (req.session as any)?.user as AuthSessionData | undefined;
  if (!session || !session.userId) {
    // 若当前为前台普通会员会话，明确返回 403 禁止跨域访问管理后台
    if ((req.session as any)?.member || (req.session as any)?.memberUser) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: '普通会员无权访问管理后台' },
      });
    }
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录管理员账号' },
    });
  }

  // 检查管理员账户有效性与 tokenVersion 版本（实现密码修改后原子注销旧 Session）
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { tokenVersion: true, status: true, role: true },
  });

  if (!dbUser || dbUser.status === UserStatus.DISABLED) {
    if (req.session) {
      req.session.destroy();
    }
    return reply.status(401).send({
      success: false,
      error: { code: 'ACCOUNT_DISABLED', message: '该管理员账号已被禁用或不存在' },
    });
  }

  if (session.tokenVersion !== undefined && dbUser.tokenVersion !== session.tokenVersion) {
    if (req.session) {
      req.session.destroy();
    }
    return reply.status(401).send({
      success: false,
      error: { code: 'SESSION_REVOKED', message: '管理员凭据已变更或会话已注销，请重新登录' },
    });
  }

  session.role = dbUser.role;
  req.adminUser = session;
}

export function requireRole(allowedRoles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (!req.adminUser) return;

    if (!allowedRoles.includes(req.adminUser.role) && req.adminUser.role !== Role.SUPER_ADMIN) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: '权限不足，无法执行该操作' },
      });
    }
  };
}

export async function requireMemberAuth(req: FastifyRequest, reply: FastifyReply) {
  // 从 session 获取前台会员用户登录态 (与管理员系统物理隔离)
  const session = (req.session as any)?.member as MemberSessionData | undefined;
  if (!session || !session.memberId) {
    return reply.status(401).send({
      success: false,
      error: { code: 'MEMBER_UNAUTHORIZED', message: '请先登录会员账号' },
    });
  }
  req.memberUser = session;
}

export async function optionalMemberAuth(req: FastifyRequest) {
  const session = (req.session as any)?.member as MemberSessionData | undefined;
  if (session && session.memberId) {
    req.memberUser = session;
  }
}
