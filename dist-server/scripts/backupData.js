import { prisma } from '../db';
import fs from 'fs';
import path from 'path';
async function backup() {
    console.log('📦 开始全面备份数据库所有表数据...');
    const [users, members, categories, softwares, versions, sources, licenses, hostedFiles, signatures, tutorials, downloadEvents, products, orders, entitlements, payments, authLogs, refunds, auditLogs,] = await Promise.all([
        prisma.user.findMany(),
        prisma.memberUser.findMany(),
        prisma.category.findMany(),
        prisma.software.findMany(),
        prisma.softwareVersion.findMany(),
        prisma.downloadSource.findMany(),
        prisma.resourceLicense.findMany(),
        prisma.hostedFile.findMany(),
        prisma.signatureVerification.findMany(),
        prisma.tutorial.findMany(),
        prisma.downloadEvent.findMany(),
        prisma.product.findMany(),
        prisma.order.findMany(),
        prisma.entitlement.findMany(),
        prisma.paymentLog.findMany(),
        prisma.downloadAuthorizationLog.findMany(),
        prisma.refund.findMany(),
        prisma.auditLog.findMany(),
    ]);
    const backupData = {
        timestamp: new Date().toISOString(),
        counts: {
            users: users.length,
            members: members.length,
            categories: categories.length,
            softwares: softwares.length,
            versions: versions.length,
            sources: sources.length,
            licenses: licenses.length,
            hostedFiles: hostedFiles.length,
            signatures: signatures.length,
            tutorials: tutorials.length,
            downloadEvents: downloadEvents.length,
            products: products.length,
            orders: orders.length,
            entitlements: entitlements.length,
            payments: payments.length,
            authLogs: authLogs.length,
            refunds: refunds.length,
            auditLogs: auditLogs.length,
        },
        data: {
            users,
            members,
            categories,
            softwares,
            versions,
            sources,
            licenses,
            hostedFiles: hostedFiles.map(h => ({ ...h, sizeBytes: h.sizeBytes.toString() })),
            signatures,
            tutorials,
            downloadEvents,
            products,
            orders,
            entitlements,
            payments,
            authLogs,
            refunds,
            auditLogs,
        },
    };
    const backupPath = path.resolve('server/prisma/backup_pre_p21.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`✅ 数据库备份完成！文件保存至: ${backupPath}`);
    console.log('统计明细:', JSON.stringify(backupData.counts, null, 2));
}
backup()
    .catch(err => {
    console.error('❌ 备份失败:', err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
