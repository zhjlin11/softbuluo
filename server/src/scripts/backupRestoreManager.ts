import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

export interface BackupResult {
  success: boolean;
  filePath: string;
  sizeBytes: number;
  durationMs: number;
  error?: string;
}

export interface RestoreDrillResult {
  success: boolean;
  testDbName: string;
  durationMs: number;
  verification?: {
    tablesCount: number;
    softwareCount: number;
    usersCount: number;
    ordersCount: number;
    membersCount: number;
    migrationsCount: number;
    foreignKeysCount: number;
    uniqueIndexesCount: number;
  };
  error?: string;
}

/**
 * 清理超出保留数量的旧备份文件 (默认保留最新 10 份)
 */
export function pruneOldBackups(backupsDir?: string, maxRetain = 10): number {
  const dir = backupsDir || path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) return 0;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.dump') || f.endsWith('.sql'))
    .map((f) => {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      return { path: p, time: stat.mtimeMs };
    })
    .sort((a, b) => b.time - a.time);

  let pruned = 0;
  if (files.length > maxRetain) {
    const toDelete = files.slice(maxRetain);
    for (const f of toDelete) {
      try {
        fs.unlinkSync(f.path);
        pruned++;
      } catch {
        // 忽略删除失败
      }
    }
  }
  return pruned;
}

function findPostgresBinary(binaryName: string): string {
  const commonPaths = [
    `C:\\Program Files\\PostgreSQL\\16\\bin\\${binaryName}.exe`,
    `C:\\Program Files\\PostgreSQL\\15\\bin\\${binaryName}.exe`,
    `C:\\Program Files\\PostgreSQL\\14\\bin\\${binaryName}.exe`,
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  return binaryName; // 回退到 PATH
}

/**
 * 执行 PostgreSQL 生产级二进制自定义格式备份 (pg_dump -F c)
 */
export async function performDatabaseBackup(options?: {
  outputFile?: string;
  dbName?: string;
}): Promise<BackupResult> {
  const startTime = Date.now();
  const dbName = options?.dbName || 'softbuluo';
  const backupsDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetPath = options?.outputFile || path.join(backupsDir, `softbuluo_${timestamp}.dump`);
  const pgDumpBin = findPostgresBinary('pg_dump');

  return new Promise((resolve) => {
    // 凭据仅注入子进程独立环境变量，严禁出现在命令行参数或审计日志
    const env = { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' };

    execFile(
      pgDumpBin,
      ['-h', 'localhost', '-p', '5432', '-U', 'postgres', '-F', 'c', '-b', '-v', '-f', targetPath, dbName],
      { env },
      (err, _stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        if (err) {
          return resolve({
            success: false,
            filePath: targetPath,
            sizeBytes: 0,
            durationMs,
            error: err.message || stderr,
          });
        }

        try {
          const stats = fs.statSync(targetPath);
          return resolve({
            success: true,
            filePath: targetPath,
            sizeBytes: stats.size,
            durationMs,
          });
        } catch (statErr: any) {
          return resolve({
            success: false,
            filePath: targetPath,
            sizeBytes: 0,
            durationMs,
            error: statErr.message,
          });
        }
      }
    );
  });
}

/**
 * 在隔离环境测试数据库执行恢复演练，并校验数据完整性与约束
 * 强制安全防线：绝对禁止在正式生产库 softbuluo 上直接执行恢复演练！
 */
export async function performRestoreDrill(
  dumpFilePath: string,
  testDbName = 'softbuluo_restore_test'
): Promise<RestoreDrillResult> {
  if (testDbName.toLowerCase() === 'softbuluo') {
    throw new Error('致命安全防线触发：严禁向正在运行的正式数据库 softbuluo 执行恢复测试！');
  }

  if (!fs.existsSync(dumpFilePath)) {
    return {
      success: false,
      testDbName,
      durationMs: 0,
      error: `备份文件不存在: ${dumpFilePath}`,
    };
  }

  const startTime = Date.now();
  const psqlBin = findPostgresBinary('psql');
  const pgRestoreBin = findPostgresBinary('pg_restore');
  const env = { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' };

  // 1. 在隔离库中重建目标演练库
  const runCmd = (bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((res, rej) => {
      execFile(bin, args, { env }, (err, stdout, stderr) => {
        if (err) return rej(new Error(stderr || err.message));
        res({ stdout, stderr });
      });
    });
  };

  try {
    // 强制终止该测试库上的活跃连接并依次独立重建（DROP/CREATE DATABASE 必须单语句独立执行）
    await runCmd(psqlBin, [
      '-h', 'localhost',
      '-p', '5432',
      '-U', 'postgres',
      '-d', 'postgres',
      '-c', `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDbName}';`,
    ]).catch(() => {});

    await runCmd(psqlBin, [
      '-h', 'localhost',
      '-p', '5432',
      '-U', 'postgres',
      '-d', 'postgres',
      '-c', `DROP DATABASE IF EXISTS "${testDbName}";`,
    ]);

    await runCmd(psqlBin, [
      '-h', 'localhost',
      '-p', '5432',
      '-U', 'postgres',
      '-d', 'postgres',
      '-c', `CREATE DATABASE "${testDbName}";`,
    ]);

    // 2. 执行二进制恢复
    await runCmd(pgRestoreBin, [
      '-h', 'localhost',
      '-p', '5432',
      '-U', 'postgres',
      '-d', testDbName,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      dumpFilePath,
    ]).catch(() => {
      // pg_restore 在有 warnings/notice 时可能返回非零，继续做物理验证
    });

    // 3. 连接到恢复后的隔离测试库，执行完整度与行数核验
    const testDbPrisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://postgres:postgres@localhost:5432/${testDbName}?schema=public`,
        },
      },
    });

    try {
      const [softwareCount, usersCount, ordersCount, membersCount] = await Promise.all([
        testDbPrisma.software.count(),
        testDbPrisma.user.count(),
        testDbPrisma.order.count(),
        testDbPrisma.memberUser.count(),
      ]);

      const [tablesQuery, migrationsQuery, fkQuery, uniqueQuery]: any[] = await Promise.all([
        testDbPrisma.$queryRaw`SELECT count(*)::bigint as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
        testDbPrisma.$queryRaw`SELECT count(*)::bigint as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`.catch(() => [{ count: 0n }]),
        testDbPrisma.$queryRaw`SELECT count(*)::bigint as count FROM information_schema.table_constraints WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'`,
        testDbPrisma.$queryRaw`SELECT count(*)::bigint as count FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE '%UNIQUE%'`,
      ]);

      const tablesCount = Number(tablesQuery[0]?.count || 0);
      const migrationsCount = Number(migrationsQuery[0]?.count || 0);
      const foreignKeysCount = Number(fkQuery[0]?.count || 0);
      const uniqueIndexesCount = Number(uniqueQuery[0]?.count || 0);

      await testDbPrisma.$disconnect();

      return {
        success: true,
        testDbName,
        durationMs: Date.now() - startTime,
        verification: {
          tablesCount,
          softwareCount,
          usersCount,
          ordersCount,
          membersCount,
          migrationsCount,
          foreignKeysCount,
          uniqueIndexesCount,
        },
      };
    } catch (vErr: any) {
      await testDbPrisma.$disconnect();
      return {
        success: false,
        testDbName,
        durationMs: Date.now() - startTime,
        error: `恢复库数据核验失败: ${vErr.message}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      testDbName,
      durationMs: Date.now() - startTime,
      error: `恢复演练执行异常: ${err.message}`,
    };
  }
}
