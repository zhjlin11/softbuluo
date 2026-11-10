import { governanceService } from '../server/src/modules/governance/governanceService';
import { prisma } from '../server/src/db';

async function main() {
  console.log('Running governance audit on existing resources...');
  const metrics = await governanceService.auditAllResources();
  console.log('Audit completed successfully!');
  console.log('Post-Audit Governance Metrics:');
  console.log(JSON.stringify(metrics, null, 2));

  const queue = await governanceService.getAuditQueue({ page: 1, pageSize: 10 });
  console.log(`\nAudit Queue Sample (${queue.pagination.total} items in queue):`);
  queue.items.forEach((item) => {
    console.log(`- [${item.dataIntegrityStatus}] ${item.name} (${item.slug}): ${item.auditNotes}`);
  });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
