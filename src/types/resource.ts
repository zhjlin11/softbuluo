/**
 * 软件与资源平台数据实体类型定义
 */

export type SourceType =
  | 'OFFICIAL_EXTERNAL'
  | 'LICENSED_HOSTED'
  | 'COMMUNITY_MIRROR'
  | 'OFFICIAL_DIRECT'
  | 'OFFICIAL_RELEASE'
  | 'AUTHORIZED_MIRROR'
  | 'EXTERNAL_DOWNLOAD_PAGE'
  | 'UNAVAILABLE';

export type SoftwareType = 'DESKTOP' | 'UTILITY' | 'DEV' | 'MEDIA' | 'SECURITY' | 'GAME';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'COMMUNITY_TESTED' | 'FAILED' | 'DISABLED';

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
  directFileUrl?: string | null;
  fileName?: string | null;
  fileVersion?: string;
  platform?: string;
  architecture?: string;
  sha256?: string | null;
  fileSizeLabel?: string;
  mirrorAuthorizationStatus?: string;
  scanStatus?: string;
  signatureStatus?: string;
  lastCheckStatus?: string;
  priority?: number;
  verificationStatus: VerificationStatus;
  fileSha256?: string;
  lastCheckedDate: string;
  isDirectDownload: boolean;
  startDownloadUrl?: string;
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
  sourceVerified?: boolean;
  sourceStatus?: string;
  scanStatus?: 'PENDING' | 'SCANNING' | 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'NOT_SCANNED';
  fileSha256?: string | null;
  signerName?: string | null;
  scanNotice?: string;
  signatureStatus?: 'NOT_CHECKED' | 'VALID' | 'UNSIGNED' | 'INVALID';
  signatureNotice?: string;
  disclaimerNotice?: string;
  coverUrl?: string;
  genre?: string | null;
  distributionPlatform?: string | null;
  supportedPlatforms?: string;
  priceType?: string | null;
  screenshots?: Array<{ url: string; caption: string }>;
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
  coverUrl?: string;
  screenshots?: Array<{ url: string; caption: string }>;
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
