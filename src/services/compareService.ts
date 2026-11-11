export interface CompareSoftwareItemDto {
  id: string;
  slug: string;
  name: string;
  englishName: string | null;
  summary: string;
  iconUrl: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  developer: string | null;
  licenseType: string;
  priceType: string;
  latestVersion: string | null;
  releaseDate: string | null;
  platform: string | null;
  fileSize: string | null;
  viewCount: number;
  downloadCount: number;
  publishedAt: string | null;
  updatedAt: string;
  hasVerifiedSource: boolean;
  registeredSourcesCount: number;
  approvedHealthySourcesCount: number;
  sha256Verified: boolean;
}

export type SelectableSoftware = CompareSoftwareItemDto;

export interface QuickPairItem {
  leftSlug: string;
  leftName: string;
  rightSlug: string;
  rightName: string;
  categoryName: string;
  tagline: string;
  hasCuratedArticle: boolean;
}

export interface HeroSlideItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  conclusion: string | null;
  badgeText: string;
  targetUrl: string;
  matrixUrl: string;
  softwareA: {
    slug: string;
    name: string;
    iconUrl: string | null;
    version: string;
    licenseType: string;
    categoryName: string;
    editorNotes: string | null;
    isRecommended: boolean;
  };
  softwareB: {
    slug: string;
    name: string;
    iconUrl: string | null;
    version: string;
    licenseType: string;
    categoryName: string;
    editorNotes: string | null;
    isRecommended: boolean;
  };
}

export interface FeaturedComparisonArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  conclusion: string | null;
  targetAudience: string | null;
  scenarioGuide: string | null;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  items: Array<{
    slug: string;
    name: string;
    iconUrl: string | null;
    isRecommended: boolean;
    editorNotes: string | null;
  }>;
  attributesCount: number;
}

export interface CategoryShelfItem {
  id: string;
  name: string;
  slug: string;
  softwareCount: number;
  suggestedPair: {
    leftSlug: string;
    leftName: string;
    rightSlug: string;
    rightName: string;
  };
  sampleSoftwares: Array<{
    slug: string;
    name: string;
    iconUrl: string | null;
  }>;
}

export interface AlternativeItem {
  id: string;
  fromSlug: string;
  fromName: string;
  fromIconUrl: string | null;
  fromLicense: string;
  toSlug: string;
  toName: string;
  toIconUrl: string | null;
  toLicense: string;
  reason: string;
  relationType: string;
  matrixUrl: string;
}

export interface DecisionGuideItem {
  id: string;
  scenario: string;
  targetUsers: string;
  keyCriteria: string;
  recommendedPair: {
    leftSlug: string;
    leftName: string;
    rightSlug: string;
    rightName: string;
  };
  guidance: string;
}

export interface CompareChannelData {
  channel: string;
  meta: {
    totalPublishedComparisons: number;
    totalComparableSoftwares: number;
    totalAlternatives: number;
    categoriesCount: number;
    matrixSupport: boolean;
    evidenceStatement: string;
    generatedAt: string;
  };
  heroSlides: HeroSlideItem[];
  quickPairs: QuickPairItem[];
  selectableSoftwares: CompareSoftwareItemDto[];
  featuredArticles: FeaturedComparisonArticle[];
  categoryShelves: CategoryShelfItem[];
  alternatives: AlternativeItem[];
  decisionGuides: DecisionGuideItem[];
}

export interface MatrixRowItem {
  id: string;
  label: string;
  category: 'BASIC' | 'LICENSE' | 'PLATFORM' | 'FEATURE' | 'INSTALL' | 'SOURCE' | 'EDITORIAL';
  valueA: string;
  valueB: string;
  isDifferent: boolean;
  isHighlighted?: boolean;
  evidenceStatus?: string;
  sourceUrl?: string | null;
  testEnvironment?: string | null;
}

export interface CompareMatrixData {
  softwareA: CompareSoftwareItemDto;
  softwareB: CompareSoftwareItemDto;
  isSameCategory: boolean;
  crossCategoryNotice: string | null;
  curatedArticle: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    conclusion: string | null;
    targetAudience: string | null;
    scenarioGuide: string | null;
    viewCount?: number;
    publishedAt?: string | null;
  } | null;
  rows: MatrixRowItem[];
  differenceCount: number;
  totalRowCount: number;
  scenarioAdvice: {
    title: string;
    description: string;
    chooseSoftwareAIf: string[];
    chooseSoftwareBIf: string[];
  };
}

export const CompareService = {
  async getChannelData(): Promise<{ success: boolean; data?: CompareChannelData; message?: string }> {
    try {
      const res = await fetch('/api/v1/channels/compare');
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || '获取对比频道数据失败' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, message: err.message || '网络连接异常' };
    }
  },

  async getMatrix(
    leftSlug: string,
    rightSlug: string
  ): Promise<{ success: boolean; data?: CompareMatrixData; message?: string }> {
    try {
      const params = new URLSearchParams({ left: leftSlug, right: rightSlug });
      const res = await fetch(`/api/v1/channels/compare/matrix?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || '生成对比矩阵失败' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, message: err.message || '网络连接异常' };
    }
  },
};
