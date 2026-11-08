/**
 * 软件与资源平台数据实体类型定义
 */

export type SourceType = 'OFFICIAL_EXTERNAL' | 'LICENSED_HOSTED' | 'COMMUNITY_MIRROR';

export type SoftwareType = 'DESKTOP' | 'UTILITY' | 'DEV' | 'MEDIA' | 'SECURITY' | 'GAME';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'COMMUNITY_TESTED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  sortOrder: number;
  itemCount: number;
}

export interface DownloadSource {
  id: string;
  sourceType: SourceType;
  label: string;
  url: string;
  verificationStatus: VerificationStatus;
  fileSha256?: string;
  lastCheckedDate: string;
  isDirectDownload: boolean;
}

export interface SoftwareVersion {
  id: string;
  version: string;
  releaseDate: string;
  platform: string[];
  fileSize: string;
  changelog: string;
  downloadSources: DownloadSource[];
}

export interface SoftwareItem {
  id: string;
  name: string;
  slug: string;
  englishName: string;
  aliases: string[];
  developer: string;
  summary: string;
  description: string;
  iconUrl?: string;
  categorySlug: string;
  categoryName: string;
  type: SoftwareType;
  isFeatured: boolean;
  featuredRank?: number;
  downloadCount: number;
  officialSiteUrl: string;
  licenseType: 'FREE' | 'OPEN_SOURCE' | 'COMMERCIAL_TRIAL' | 'PAID';
  licenseLabel: string;
  latestVersion: SoftwareVersion;
  historyVersions?: SoftwareVersion[];
  tags: string[];
  safetyScanned: boolean;
  scanEngine?: string;
}

export interface GameItem {
  id: string;
  title: string;
  slug: string;
  genre: string;
  developer: string;
  platform: string[];
  licenseType: 'FREE' | 'OPEN_SOURCE' | 'STEAM' | 'EPIC';
  officialChannelUrl: string;
  channelName: string;
  summary: string;
  coverGradient: string;
  badgeText: string;
  releaseYear: number;
}

export interface TutorialItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  relatedSoftwareSlug?: string;
  viewCount: number;
}

export interface SearchFilter {
  categorySlug?: string;
  licenseType?: string;
  query?: string;
}

export interface SearchResult {
  items: SoftwareItem[];
  total: number;
  query: string;
  matchedCategories: Category[];
}
