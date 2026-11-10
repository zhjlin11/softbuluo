import { performDatabaseBackup } from '../server/src/scripts/backupRestoreManager';

async function main() {
  console.log('Creating pre-P8.5 backup...');
  const res = await performDatabaseBackup();
  console.log('Backup result:', res);
}

main().catch(console.error);
