import { prisma } from '../../db';
import { hashPassword, verifyPassword } from '../../utils/security';
import { Role, UserStatus } from '@prisma/client';
import { validatePasswordStrength } from '../../utils/passwordPolicy';

export interface AdminUserSession {
  id: string;
  email: string;
  username: string;
  role: Role;
  tokenVersion: number;
}

export async function loginAdmin(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: AdminUserSession; error?: string }> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    return { success: false, error: '账号或密码不正确' };
  }

  if (user.status === UserStatus.DISABLED) {
    return { success: false, error: '该账号已被停用，请联系超级管理员' };
  }

  const isMatch = await verifyPassword(plainPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: '账号或密码不正确' };
  }

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // 记录审计日志 (绝不输出密码明文或哈希)
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user.id,
      after: JSON.stringify({ email: user.email, role: user.role }),
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
  };
}

/**
 * 管理员修改密码（支持主动修改，并强制撤回旧 Session）
 */
export async function changeAdminPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: '用户不存在' };
  }

  const isMatch = await verifyPassword(oldPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: '原密码验证失败' };
  }

  if (oldPassword === newPassword) {
    return { success: false, error: '新密码不能与原密码相同' };
  }

  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.valid) {
    return { success: false, error: strengthCheck.reason || '新密码强度不足' };
  }

  const newHash = await hashPassword(newPassword);

  // 更新密码哈希并原子递增 tokenVersion，使得所有现有 Session 立即失效
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      tokenVersion: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'CHANGE_PASSWORD',
      targetType: 'USER',
      targetId: userId,
      after: JSON.stringify({ email: user.email, tokenVersion: updated.tokenVersion }),
    },
  });

  return { success: true };
}

/**
 * 超级管理员安全重置指定管理员密码
 */
export async function resetAdminPassword(
  targetUserId: string,
  newPassword: string,
  operatorId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    return { success: false, error: '目标用户不存在' };
  }

  const strengthCheck = validatePasswordStrength(newPassword);
  if (!strengthCheck.valid) {
    return { success: false, error: strengthCheck.reason || '新密码强度不足' };
  }

  const newHash = await hashPassword(newPassword);

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      passwordHash: newHash,
      tokenVersion: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: operatorId,
      action: 'RESET_PASSWORD',
      targetType: 'USER',
      targetId: targetUserId,
      after: JSON.stringify({ email: user.email, tokenVersion: updated.tokenVersion }),
    },
  });

  return { success: true };
}

export async function createInitialSuperAdmin(
  email: string,
  username: string,
  plainPassword: string
) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    throw new Error(`用户 ${email} 或 ${username} 已存在，无法重复初始化`);
  }

  const strengthCheck = validatePasswordStrength(plainPassword);
  if (!strengthCheck.valid) {
    throw new Error(`初始化密码不合规: ${strengthCheck.reason}`);
  }

  const passwordHash = await hashPassword(plainPassword);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      tokenVersion: 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'INIT_SUPER_ADMIN',
      targetType: 'USER',
      targetId: user.id,
      after: JSON.stringify({ email: user.email, role: user.role }),
    },
  });

  return user;
}
