import { prisma } from '../../db';
import { JobType, JobStatus, JobRunStatus } from '@prisma/client';
import crypto from 'crypto';
import { checkSoftwareUpdate } from '../versions/versionMonitorService';
import { checkAllDownloadSources } from '../linkHealth/linkHealthService';
import { evaluateSoftwareQuality } from './qualityService';

/**
 * 初始化系统默认定时调度作业
 */
export async function initDefaultJobs() {
  const defaultJobs = [
    {
      name: '官方软件新版本自动监测',
      jobType: JobType.VERSION_CHECK,
      description: '定时扫描已登记官方 Releases 来源，智能比对新版本并生成待审候选',
      intervalSec: 86400, // 每天
    },
    {
      name: '全站下载链接健康巡检',
      jobType: JobType.LINK_HEALTH_CHECK,
      description: '探测官方外链可达性、HTTP 响应码、重定向及防 SSRF 保护',
      intervalSec: 86400, // 每天
    },
    {
      name: '资源完整度与质量重新评估',
      jobType: JobType.RESOURCE_QUALITY_CHECK,
      description: '重新计算全部软件的资料完整度评分 (0-100) 并生成优化建议',
      intervalSec: 43200, // 12 小时
    },
    {
      name: '动态站点地图与搜索引擎缓存预热',
      jobType: JobType.SITEMAP_REBUILD,
      description: '统计已发布正式资源，预热并校验 Sitemap.xml 数据',
      intervalSec: 21600, // 6 小时
    },
  ];

  for (const jobDef of defaultJobs) {
    await prisma.job.upsert({
      where: { name: jobDef.name },
      create: {
        name: jobDef.name,
        jobType: jobDef.jobType,
        description: jobDef.description,
        intervalSec: jobDef.intervalSec,
        status: JobStatus.IDLE,
        enabled: true,
      },
      update: {},
    });
  }
}

/**
 * 生产级崩溃与租约过期任务自动恢复程序
 * 场景：Worker 异常退出、服务被强行终止或宿主机重启导致任务永久卡在 RUNNING
 */
export async function recoverStaleJobs(leaseTimeoutMs = 5 * 60 * 1000): Promise<{
  recoveredCount: number;
  recoveredJobs: string[];
}> {
  const threshold = new Date(Date.now() - leaseTimeoutMs);

  // 1. 查找所有超过租约时长仍处于 RUNNING 的任务
  const staleJobs = await prisma.job.findMany({
    where: {
      status: JobStatus.RUNNING,
      OR: [{ lockedAt: null }, { lockedAt: { lt: threshold } }],
    },
  });

  const recoveredJobs: string[] = [];

  for (const job of staleJobs) {
    // 2. 标记关联未完成的 jobRun 为 FAILED
    await prisma.jobRun.updateMany({
      where: {
        jobId: job.id,
        status: JobRunStatus.RUNNING,
      },
      data: {
        status: JobRunStatus.FAILED,
        errorSummary: '系统重启或租约超时：上一任 Worker 异常终止，租约已安全回收',
        finishedAt: new Date(),
      },
    });

    // 3. 释放作业锁并恢复为 IDLE
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.IDLE,
        lockToken: null,
        lockedAt: null,
      },
    });

    recoveredJobs.push(job.name);
  }

  return {
    recoveredCount: staleJobs.length,
    recoveredJobs,
  };
}

/**
 * 触发执行调度作业（具备分布式锁/数据库租约并发控制与防重入）
 */
export async function runJob(jobId: string): Promise<{
  success: boolean;
  runNo: string;
  message: string;
  details?: any;
}> {
  const lockToken = crypto.randomUUID();
  const now = new Date();
  const lockTimeout = new Date(now.getTime() - 5 * 60 * 1000); // 5分钟租约超时

  // 1. 原子获取任务锁，防止多个进程或并发请求同时执行同一作业
  const updateLock = await prisma.job.updateMany({
    where: {
      id: jobId,
      enabled: true,
      OR: [
        { status: JobStatus.IDLE },
        { lockedAt: { lt: lockTimeout } }, // 锁超时自动释放
      ],
    },
    data: {
      status: JobStatus.RUNNING,
      lockToken,
      lockedAt: now,
    },
  });

  if (updateLock.count === 0) {
    return {
      success: false,
      runNo: '',
      message: '该作业当前正在运行中或处于禁用状态，已安全跳过重复执行',
    };
  }

  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const runNo = `RUN${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  // 2. 创建运行日志记录
  const jobRun = await prisma.jobRun.create({
    data: {
      jobId: job.id,
      runNo,
      status: JobRunStatus.RUNNING,
      startedAt: now,
    },
  });

  let totalItems = 0;
  let successItems = 0;
  let failedItems = 0;
  let logOutput = '';
  let errorSummary = '';

  try {
    // 3. 根据作业类型分发业务逻辑
    if (job.jobType === JobType.VERSION_CHECK) {
      logOutput += `[${now.toISOString()}] 开始执行官方新版本检测...\n`;
      const softwares = await prisma.software.findMany({
        where: { status: 'PUBLISHED' },
        take: 50,
      });
      totalItems = softwares.length;

      for (const sw of softwares) {
        try {
          const res = await checkSoftwareUpdate(sw.id);
          successItems++;
          if (res.hasNewVersion) {
            logOutput += `-> 软件 [${sw.name}] 发现新版本: ${res.candidateVersion}\n`;
          }
        } catch (err: any) {
          failedItems++;
          logOutput += `-> 软件 [${sw.name}] 检测出错: ${err.message}\n`;
        }
      }
    } else if (job.jobType === JobType.LINK_HEALTH_CHECK) {
      logOutput += `[${now.toISOString()}] 开始执行下载源健康巡检...\n`;
      const checkRes = await checkAllDownloadSources(30);
      totalItems = checkRes.scannedCount;
      successItems = checkRes.healthyCount + checkRes.redirectedCount;
      failedItems = checkRes.brokenCount;
      logOutput += `巡检汇总: 扫描 ${checkRes.scannedCount} 项, 正常: ${checkRes.healthyCount}, 失效: ${checkRes.brokenCount}\n`;
    } else if (job.jobType === JobType.RESOURCE_QUALITY_CHECK) {
      logOutput += `[${now.toISOString()}] 开始重新计算全站软件资料完整度...\n`;
      const softwares = await prisma.software.findMany({ select: { id: true, name: true } });
      totalItems = softwares.length;

      for (const sw of softwares) {
        try {
          await evaluateSoftwareQuality(sw.id);
          successItems++;
        } catch {
          failedItems++;
        }
      }
      logOutput += `评估汇总: 成功打分 ${successItems} 款软件\n`;
    } else if (job.jobType === JobType.SITEMAP_REBUILD) {
      const pubCount = await prisma.software.count({ where: { status: 'PUBLISHED', isTestData: false } });
      totalItems = pubCount;
      successItems = pubCount;
      logOutput += `[${now.toISOString()}] 站点地图预热完成，收录可索引已发布正式资源: ${pubCount} 项\n`;
    }

    // 4. 更新作业完成状态
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: JobRunStatus.SUCCEEDED,
        totalItems,
        successItems,
        failedItems,
        logOutput,
        finishedAt: new Date(),
      },
    });

    return {
      success: true,
      runNo,
      message: `作业执行完成 (成功: ${successItems}, 失败: ${failedItems})`,
      details: { totalItems, successItems, failedItems },
    };
  } catch (fatalErr: any) {
    errorSummary = fatalErr.message || '调度执行发生致命异常';
    logOutput += `[FATAL ERROR]: ${errorSummary}\n`;

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: JobRunStatus.FAILED,
        errorSummary,
        logOutput,
        finishedAt: new Date(),
      },
    });

    return {
      success: false,
      runNo,
      message: `作业执行失败: ${errorSummary}`,
    };
  } finally {
    // 5. 严格释放作业锁
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.IDLE,
        lockToken: null,
        lockedAt: null,
        lastRunAt: new Date(),
      },
    });
  }
}
