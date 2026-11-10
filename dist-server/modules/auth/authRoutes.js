import { z } from 'zod';
import { loginAdmin, changeAdminPassword, resetAdminPassword } from './authService';
import { requireAuth, requireRole } from '../../middleware/auth';
import { adminLoginLimiter } from '../../utils/passwordPolicy';
import { Role } from '@prisma/client';
const loginSchema = z.object({
    identifier: z.string().min(1, '请输入用户名或邮箱'),
    password: z.string().min(1, '请输入登录密码'),
});
const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(10, '新密码长度至少需要 10 位'),
    confirmPassword: z.string().min(10, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
});
const resetPasswordSchema = z.object({
    targetUserId: z.string().min(1, '目标管理员 ID 不能为空'),
    newPassword: z.string().min(10, '重置新密码长度至少需要 10 位'),
});
export async function authRoutes(server) {
    // 管理员安全登录 (集成防暴力破解与失败锁定)
    server.post('/api/v1/admin/login', async (req, reply) => {
        const parseRes = loginSchema.safeParse(req.body);
        if (!parseRes.success) {
            const errMsg = parseRes.error.issues?.[0]?.message || '参数校验失败';
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: errMsg },
            });
        }
        const { identifier, password } = parseRes.data;
        const clientIp = req.ip || '127.0.0.1';
        // 检查是否已被临时锁定
        const lockCheck = adminLoginLimiter.check(identifier, clientIp);
        if (!lockCheck.allowed) {
            return reply.status(429).send({
                success: false,
                error: {
                    code: 'RATE_LIMITED',
                    message: `登录尝试失败次数过多，账户与IP已安全锁定，请在 ${lockCheck.remainingLockSeconds} 秒后再试`,
                },
            });
        }
        const result = await loginAdmin(identifier, password);
        if (!result.success || !result.user) {
            const failStatus = adminLoginLimiter.recordFailure(identifier, clientIp);
            if (failStatus.locked) {
                return reply.status(429).send({
                    success: false,
                    error: {
                        code: 'RATE_LIMITED',
                        message: `连续密码错误达上限，账号已被临时锁定 ${failStatus.remainingLockSeconds} 秒`,
                    },
                });
            }
            return reply.status(401).send({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: result.error || '账号或密码不正确' },
            });
        }
        // 登录成功，重置失败计数
        adminLoginLimiter.recordSuccess(identifier, clientIp);
        // 设置 session
        req.session.user = {
            userId: result.user.id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            tokenVersion: result.user.tokenVersion,
        };
        return reply.send({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role,
                },
            },
        });
    });
    // 获取当前登录管理员信息
    server.get('/api/v1/admin/me', { preHandler: [requireAuth] }, async (req, reply) => {
        return reply.send({
            success: true,
            data: {
                user: req.adminUser,
            },
        });
    });
    // 管理员主动修改密码（强制废除旧 Session）
    server.post('/api/v1/admin/auth/change-password', { preHandler: [requireAuth] }, async (req, reply) => {
        const parseRes = changePasswordSchema.safeParse(req.body);
        if (!parseRes.success) {
            const errMsg = parseRes.error.issues?.[0]?.message || '密码参数格式不正确';
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: errMsg },
            });
        }
        const { oldPassword, newPassword } = parseRes.data;
        const changeRes = await changeAdminPassword(req.adminUser.userId, oldPassword, newPassword);
        if (!changeRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'PASSWORD_CHANGE_FAILED', message: changeRes.error },
            });
        }
        // 注销当前会话以强制重新使用新密码登录
        if (req.session) {
            req.session.destroy();
        }
        return reply.send({
            success: true,
            data: { message: '密码修改成功，所有活跃会话已注销，请使用新密码重新登录' },
        });
    });
    // 超级管理员重置其他管理员密码
    server.post('/api/v1/admin/auth/reset-password', { preHandler: [requireAuth, requireRole([Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = resetPasswordSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: parseRes.error.issues?.[0]?.message || '参数校验失败' },
            });
        }
        const { targetUserId, newPassword } = parseRes.data;
        const resetRes = await resetAdminPassword(targetUserId, newPassword, req.adminUser.userId);
        if (!resetRes.success) {
            return reply.status(400).send({
                success: false,
                error: { code: 'RESET_FAILED', message: resetRes.error },
            });
        }
        return reply.send({
            success: true,
            data: { message: '密码重置成功，目标管理员旧会话已注销' },
        });
    });
    // 管理员登出
    server.post('/api/v1/admin/logout', async (req, reply) => {
        if (req.session) {
            req.session.destroy();
        }
        return reply.send({
            success: true,
            data: { message: '已安全登出' },
        });
    });
}
