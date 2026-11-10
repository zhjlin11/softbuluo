import { performDatabaseBackup, performRestoreDrill } from '../server/src/scripts/backupRestoreManager';

async function main() {
  console.log('1. Starting database backup...');
  const b = await performDatabaseBackup();
  console.log('Backup result:', JSON.stringify(b, null, 2));

  if (!b.success) {
    console.error('Backup failed!');
    process.exit(1);
  }

  console.log('2. Starting restore drill into softbuluo_restore_test...');
  const r = await performRestoreDrill(b.filePath, 'softbuluo_restore_test');
  console.log('Restore drill result:', JSON.stringify(r, null, 2));

  if (!r.success) {
    console.error('Restore drill failed!');
    process.exit(1);
  }

  console.log('✅ PostgreSQL Backup & Restore Drill 100% verified successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
