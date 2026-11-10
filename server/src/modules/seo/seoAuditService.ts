import { prisma } from '../../db';
import { SeoService } from './seoService';
import { ResourceStatus, ResourceType, ComparisonStatus } from '@prisma/client';

export interface AuditIssue {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  field: string;
  message: string;
  fixAdvice: string;
}

export class SeoAuditService {
  /**
   * 针对指定公开 HTML 结构执行 0-100 质量审计评分
   */
  static evaluateHtmlSeo(html: string, pageUrl: string): {
    score: number;
    issues: AuditIssue[];
    hasH1: boolean;
    hasCanonical: boolean;
    hasSchema: boolean;
    titleLength: number;
    descriptionLength: number;
    contentWords: number;
  } {
    const issues: AuditIssue[] = [];
    let score = 100;

    // 1. 检查 Title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const titleLength = title.length;

    if (!title) {
      score -= 30;
      issues.push({
        level: 'CRITICAL',
        field: 'title',
        message: '页面缺少 <title> 标题标签',
        fixAdvice: '添加明确的包含软件名称与分类的标题模板',
      });
    } else if (titleLength < 12) {
      score -= 10;
      issues.push({
        level: 'MEDIUM',
        field: 'title',
        message: `标题过短 (${titleLength} 字符)，信息量不足`,
        fixAdvice: '建议扩展包含版本号与分类属性，建议长度 20-50 字符',
      });
    } else if (titleLength > 75) {
      score -= 10;
      issues.push({
        level: 'MEDIUM',
        field: 'title',
        message: `标题过长 (${titleLength} 字符)，在搜索结果中可能被截断`,
        fixAdvice: '精炼核心关键词，将非必要宣传语移至 Description',
      });
    }

    // 2. 检查 Description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    const descriptionLength = description.length;

    if (!description) {
      score -= 20;
      issues.push({
        level: 'HIGH',
        field: 'description',
        message: '缺少 Meta Description 描述标签',
        fixAdvice: '补充软件功能、用途与支持平台的客观摘要',
      });
    } else if (descriptionLength < 40) {
      score -= 8;
      issues.push({
        level: 'LOW',
        field: 'description',
        message: `描述信息偏短 (${descriptionLength} 字符)`,
        fixAdvice: '建议补充核心使用场景与版本亮点，建议长度 60-150 字符',
      });
    }

    // 3. 检查 H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const hasH1 = Boolean(h1Match && h1Match[1].trim().length > 0);
    if (!hasH1) {
      score -= 20;
      issues.push({
        level: 'CRITICAL',
        field: 'h1',
        message: '页面缺少唯一的核心 <h1> 标签',
        fixAdvice: '在页面主视觉区首位加入软件或主题名称 <h1>',
      });
    }

    // 4. 检查 Canonical
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
    const hasCanonical = Boolean(canonicalMatch && canonicalMatch[1].trim().length > 0);
    if (!hasCanonical) {
      score -= 15;
      issues.push({
        level: 'HIGH',
        field: 'canonical',
        message: '缺少 Canonical 规范链接',
        fixAdvice: '添加指向公网正式规范 URL 的 canonical 标签',
      });
    }

    // 5. 检查 Schema.org
    const hasSchema = html.includes('application/ld+json') && html.includes('schema.org');
    if (!hasSchema) {
      score -= 15;
      issues.push({
        level: 'MEDIUM',
        field: 'schema',
        message: '未发现 Schema.org 结构化 JSON-LD 数据',
        fixAdvice: '注入 SoftwareApplication, VideoGame 或 WebSite 结构化数据',
      });
    }

    // 6. 正文词量估算
    const plainText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const contentWords = plainText.length;
    if (contentWords < 300) {
      score -= 10;
      issues.push({
        level: 'LOW',
        field: 'content',
        message: '页面正文文字量偏低，深度内容不足',
        fixAdvice: '丰富软件介绍、功能特性、常见问题或更新日志',
      });
    }

    const finalScore = Math.max(0, Math.min(100, score));
    return {
      score: finalScore,
      issues,
      hasH1,
      hasCanonical,
      hasSchema,
      titleLength,
      descriptionLength,
      contentWords,
    };
  }

  /**
   * 审计单个软件详情页
   */
  static async auditSoftwarePage(slug: string) {
    const { html, status } = await SeoService.renderSoftwareHtml(slug);
    const pageUrl = `/software/${slug}`;

    if (status !== 200) {
      return prisma.seoPageAudit.upsert({
        where: { pageUrl },
        create: {
          pageUrl,
          pageType: 'SOFTWARE',
          score: 0,
          issuesCount: 1,
          issuesList: JSON.stringify([{ level: 'CRITICAL', field: 'http', message: '页面返回非 200 状态码', fixAdvice: '核实资源状态并发布' }]),
          status: 'CRITICAL',
        },
        update: {
          score: 0,
          issuesCount: 1,
          status: 'CRITICAL',
          lastAuditedAt: new Date(),
        },
      });
    }

    const evalRes = this.evaluateHtmlSeo(html, pageUrl);
    const auditStatus = evalRes.score >= 85 ? 'PASS' : evalRes.score >= 60 ? 'WARNING' : 'CRITICAL';

    return prisma.seoPageAudit.upsert({
      where: { pageUrl },
      create: {
        pageUrl,
        pageType: 'SOFTWARE',
        score: evalRes.score,
        issuesCount: evalRes.issues.length,
        issuesList: JSON.stringify(evalRes.issues),
        hasH1: evalRes.hasH1,
        titleLength: evalRes.titleLength,
        descriptionLength: evalRes.descriptionLength,
        hasCanonical: evalRes.hasCanonical,
        hasSchema: evalRes.hasSchema,
        contentWords: evalRes.contentWords,
        status: auditStatus,
        lastAuditedAt: new Date(),
      },
      update: {
        score: evalRes.score,
        issuesCount: evalRes.issues.length,
        issuesList: JSON.stringify(evalRes.issues),
        hasH1: evalRes.hasH1,
        titleLength: evalRes.titleLength,
        descriptionLength: evalRes.descriptionLength,
        hasCanonical: evalRes.hasCanonical,
        hasSchema: evalRes.hasSchema,
        contentWords: evalRes.contentWords,
        status: auditStatus,
        lastAuditedAt: new Date(),
      },
    });
  }

  /**
   * 批量审计全站已发布公开页面
   */
  static async auditAllPublishedPages() {
    const softwares = await prisma.software.findMany({
      where: { status: ResourceStatus.PUBLISHED, isTestData: false },
      select: { slug: true, type: true },
      take: 50,
    });

    let audited = 0;
    for (const sw of softwares) {
      await this.auditSoftwarePage(sw.slug);
      audited++;
    }

    return { audited, totalCandidates: softwares.length };
  }

  static async getAuditReports(params: { page?: number; pageSize?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.status) where.status = params.status;

    const [total, items] = await Promise.all([
      prisma.seoPageAudit.count({ where }),
      prisma.seoPageAudit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ score: 'asc' }, { lastAuditedAt: 'desc' }],
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items: items.map((it) => ({
        ...it,
        issues: JSON.parse(it.issuesList || '[]'),
      })),
    };
  }
}
