/**
 * 软件与系统资源服务层 (Service Layer)
 * 统一抽象数据读取、多维搜索、参数校验与空状态处理，隔离 UI 与数据层。
 */

import { categoriesData, softwareData, gamesData, tutorialsData } from '../data/seedData';
import { Category, SoftwareItem, GameItem, TutorialItem, SearchResult } from '../types/resource';

// 允许在演示或测试环境中切换空状态
let simulateEmptyDb = false;

export const setSimulateEmptyDatabase = (val: boolean) => {
  simulateEmptyDb = val;
};

export const getSimulateEmptyDatabase = () => simulateEmptyDb;

/**
 * 关键词清洗与安全规范化（限制长度、去除控制字符防注入）
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  return query
    .trim()
    .slice(0, 50)
    .replace(/[<>'"\\;]/g, '');
}

/**
 * 软件资源多维搜索服务
 * 匹配：中文名、英文名、别名、开发者、分类名称、标签
 */
export async function searchResources(
  rawQuery: string,
  options?: {
    categorySlug?: string;
    limit?: number;
  }
): Promise<SearchResult> {
  const query = sanitizeSearchQuery(rawQuery).toLowerCase();
  const limit = options?.limit || 20;

  if (simulateEmptyDb) {
    return {
      items: [],
      total: 0,
      query,
      matchedCategories: [],
    };
  }

  let results = [...softwareData];

  // 分类筛选
  if (options?.categorySlug && options.categorySlug !== 'all') {
    results = results.filter((item) => item.categorySlug === options.categorySlug);
  }

  // 关键词检索
  if (query) {
    results = results.filter((item) => {
      const matchName = item.name.toLowerCase().includes(query);
      const matchEnglish = item.englishName.toLowerCase().includes(query);
      const matchDeveloper = item.developer.toLowerCase().includes(query);
      const matchSummary = item.summary.toLowerCase().includes(query);
      const matchCategory = item.categoryName.toLowerCase().includes(query);
      const matchAliases = item.aliases.some((alias) => alias.toLowerCase().includes(query));
      const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(query));

      return (
        matchName ||
        matchEnglish ||
        matchDeveloper ||
        matchSummary ||
        matchCategory ||
        matchAliases ||
        matchTags
      );
    });
  }

  // 匹配的相关分类
  const matchedCategorySlugs = new Set(results.map((i) => i.categorySlug));
  const matchedCategories = categoriesData.filter((cat) => matchedCategorySlugs.has(cat.slug));

  return {
    items: results.slice(0, limit),
    total: results.length,
    query,
    matchedCategories,
  };
}

/**
 * 搜索框实时联想建议 (限制 6-8 条精简结果)
 */
export async function getSearchSuggestions(rawQuery: string): Promise<SoftwareItem[]> {
  const query = sanitizeSearchQuery(rawQuery).toLowerCase();
  if (!query || query.length < 2 || simulateEmptyDb) {
    return [];
  }

  const searchRes = await searchResources(query, { limit: 6 });
  return searchRes.items;
}

/**
 * 获取首页 10 大核心分类
 */
export async function getQuickCategories(): Promise<Category[]> {
  if (simulateEmptyDb) return [];
  return [...categoriesData].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * 获取编辑精选软件 (8 款高质量资源)
 */
export async function getFeaturedSoftware(): Promise<SoftwareItem[]> {
  if (simulateEmptyDb) return [];
  return softwareData
    .filter((item) => item.isFeatured)
    .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99))
    .slice(0, 8);
}

/**
 * 获取热门下载排行软件 (根据真实下载统计排序)
 */
export async function getPopularSoftware(limit = 8): Promise<SoftwareItem[]> {
  if (simulateEmptyDb) return [];
  return [...softwareData]
    .sort((a, b) => b.downloadCount - a.downloadCount)
    .slice(0, limit);
}

/**
 * 获取最新版本更新列表 (按版本发布时间倒序)
 */
export async function getLatestUpdates(limit = 6): Promise<SoftwareItem[]> {
  if (simulateEmptyDb) return [];
  return [...softwareData]
    .sort((a, b) => {
      const dateA = new Date(a.latestVersion.releaseDate).getTime();
      const dateB = new Date(b.latestVersion.releaseDate).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * 获取系统与维修工具专区数据
 * 支持按分类子标签（系统维护、硬件检测、网络工具）切换
 */
export async function getSystemAndRepairTools(
  tab: 'all' | 'sys-tools' | 'hardware' | 'network' = 'all'
): Promise<SoftwareItem[]> {
  if (simulateEmptyDb) return [];
  const allowedCategories = ['sys-tools', 'hardware', 'network'];
  let list = softwareData.filter((item) => allowedCategories.includes(item.categorySlug));

  if (tab !== 'all') {
    list = list.filter((item) => item.categorySlug === tab);
  }

  return list;
}

/**
 * 获取正版游戏中心与开源游戏资源
 */
export async function getGameResources(): Promise<GameItem[]> {
  if (simulateEmptyDb) return [];
  return [...gamesData];
}

/**
 * 获取实用安装与系统故障排查教程
 */
export async function getTutorials(): Promise<TutorialItem[]> {
  if (simulateEmptyDb) return [];
  return [...tutorialsData];
}

/**
 * 根据 Slug 查询软件详情（包含版本历史与官方下载直达）
 */
export async function getSoftwareBySlug(slug: string): Promise<SoftwareItem | null> {
  if (simulateEmptyDb) return null;
  const item = softwareData.find((s) => s.slug === slug);
  return item || null;
}

/**
 * 记录用户点击官方/授权下载事件 (模拟后端打点统计)
 */
export async function recordDownloadClick(softwareId: string, sourceId: string): Promise<boolean> {
  const target = softwareData.find((s) => s.id === softwareId);
  if (target) {
    target.downloadCount += 1;
  }
  return true;
}
