-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('SOFTWARE', 'GAME', 'TOOL');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_EXTERNAL', 'LICENSED_HOSTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'SCANNING', 'CLEAN', 'SUSPICIOUS', 'MALICIOUS', 'FAILED');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('NOT_CHECKED', 'VALID', 'INVALID', 'UNSIGNED', 'ERROR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('OFFICIAL_LINK_CLICK', 'HOSTED_DOWNLOAD_AUTHORIZED', 'HOSTED_DOWNLOAD_COMPLETED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'DISABLED', 'BANNED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SINGLE_SERVICE', 'MONTHLY_MEMBERSHIP', 'YEARLY_MEMBERSHIP', 'LICENSED_DOWNLOAD', 'TECHNICAL_SUPPORT');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CLOSED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('SERVICE_ACCESS', 'LICENSED_DOWNLOAD', 'PREMIUM_TUTORIAL', 'MEMBERSHIP_ACCESS');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SoftwareSourceType" AS ENUM ('OFFICIAL_WEBSITE', 'OFFICIAL_API', 'GITHUB_RELEASES', 'GITLAB_RELEASES', 'OFFICIAL_RSS', 'MANUAL_IMPORT');

-- CreateEnum
CREATE TYPE "SourceTrustStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('CSV', 'EXCEL', 'OFFICIAL_URL', 'API_RELEASE');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING_REVIEW', 'PROCESSING', 'PARTIAL_SUCCESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('NEW_RESOURCE', 'EXACT_MATCH', 'POSSIBLE_DUPLICATE', 'CONFLICT');

-- CreateEnum
CREATE TYPE "BatchItemReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "CandidateReviewStatus" AS ENUM ('DISCOVERED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LinkHealthStatus" AS ENUM ('HEALTHY', 'REDIRECTED', 'TEMPORARY_ERROR', 'BROKEN', 'NEEDS_REVIEW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('SOURCE_DISCOVERY', 'VERSION_CHECK', 'LINK_HEALTH_CHECK', 'RESOURCE_QUALITY_CHECK', 'SITEMAP_REBUILD', 'SEO_PRERENDER_WARMUP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('IDLE', 'RUNNING', 'DISABLED');

-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "KeywordIntent" AS ENUM ('SOFTWARE_DOWNLOAD', 'SOFTWARE_ALTERNATIVE', 'SOFTWARE_COMPARISON', 'INSTALL_GUIDE', 'TROUBLESHOOTING', 'GAME_DISCOVERY', 'GENERAL_INFORMATION');

-- CreateEnum
CREATE TYPE "KeywordStatus" AS ENUM ('TARGETED', 'PLANNED', 'RANKING', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ComparisonStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ComparisonAttributeCategory" AS ENUM ('BASIC', 'PLATFORM', 'LICENSE', 'PERFORMANCE', 'FEATURE');

-- CreateEnum
CREATE TYPE "AlternativeRelationType" AS ENUM ('FREE_ALTERNATIVE', 'OPEN_SOURCE_ALTERNATIVE', 'CROSS_PLATFORM', 'SIMILAR_FUNCTION', 'LIGHTWEIGHT_OPTION');

-- CreateEnum
CREATE TYPE "AlternativeReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AiProviderType" AS ENUM ('OPENAI_COMPATIBLE', 'VOLCENGINE', 'DEEPSEEK', 'MOCK');

-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('RELEASE_NOTES_SUMMARY', 'SOFTWARE_INTRO_DRAFT', 'CATEGORY_SUGGESTION', 'COMPARISON_DRAFT', 'SEO_META_SUGGESTION', 'TUTORIAL_OUTLINE', 'USER_FEEDBACK_SUMMARY');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('PENDING', 'AI_DRAFT', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DataIntegrityStatus" AS ENUM ('VERIFIED_COMPLETE', 'VERIFIED_INCOMPLETE', 'NEEDS_REVIEW', 'SOURCE_UNAVAILABLE', 'DUPLICATE_CANDIDATE', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('MEASURED', 'OFFICIAL_DOCUMENTATION', 'EDITORIAL_JUDGMENT', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Software" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "englishName" TEXT,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "developer" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "type" "ResourceType" NOT NULL DEFAULT 'SOFTWARE',
    "categoryId" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publisher" TEXT,
    "genre" TEXT,
    "supportedPlatforms" TEXT DEFAULT 'Windows 10/11',
    "releaseDate" TEXT,
    "coverUrl" TEXT,
    "officialWebsite" TEXT,
    "distributionPlatform" TEXT,
    "priceType" TEXT,
    "licenseType" TEXT DEFAULT 'FREE',
    "dataIntegrityStatus" "DataIntegrityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "officialDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastAuditedAt" TIMESTAMP(3),
    "auditNotes" TEXT,

    CONSTRAINT "Software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareVersion" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'Windows 10/11',
    "architecture" TEXT NOT NULL DEFAULT 'x64',
    "fileSize" TEXT NOT NULL,
    "releaseDate" TEXT NOT NULL,
    "changelog" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadSource" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'OFFICIAL_EXTERNAL',
    "sourceName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileId" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastCheckedAt" TIMESTAMP(3),
    "lastHttpStatus" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DownloadSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceLicense" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL DEFAULT 'FREE',
    "redistributionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "commercialRedistributionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "evidenceFileKey" TEXT,
    "licenseUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ResourceLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostedFile" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT NOT NULL,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanEngine" TEXT,
    "scanEngineVersion" TEXT,
    "scannedAt" TIMESTAMP(3),
    "scanResult" TEXT,
    "scanError" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureVerification" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "signatureStatus" "SignatureStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "signerName" TEXT,
    "signerCertificateFingerprint" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifier" TEXT,
    "verificationDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "authorId" TEXT NOT NULL,
    "softwareId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoKeywords" TEXT,
    "seoDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadEvent" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL DEFAULT 'SINGLE_SERVICE',
    "description" TEXT NOT NULL,
    "priceFen" INTEGER NOT NULL,
    "originalPriceFen" INTEGER,
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "entitlementsConfig" TEXT NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "priceSnapshotFen" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmountFen" INTEGER NOT NULL,
    "totalRefundedFen" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "payChannel" TEXT DEFAULT 'WECHAT',
    "transactionId" TEXT,
    "codeUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "entitlementType" "EntitlementType" NOT NULL,
    "resourceId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "quotaRemaining" INTEGER NOT NULL DEFAULT 0,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WECHAT',
    "transactionId" TEXT,
    "amountFen" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rawNotification" TEXT,
    "eventId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadAuthorizationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "fileId" TEXT,
    "orderId" TEXT,
    "entitlementId" TEXT,
    "token" TEXT,
    "tokenHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "compensationCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadAuthorizationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountFen" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectReason" TEXT,
    "providerRefundId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "SoftwareSourceType" NOT NULL DEFAULT 'OFFICIAL_WEBSITE',
    "baseUrl" TEXT NOT NULL,
    "officialDomain" TEXT NOT NULL,
    "developerName" TEXT,
    "discoveryMethod" TEXT DEFAULT 'API_CRAWLER',
    "apiEndpoint" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "trustStatus" "SourceTrustStatus" NOT NULL DEFAULT 'PENDING',
    "rateLimit" INTEGER NOT NULL DEFAULT 60,
    "checkInterval" INTEGER NOT NULL DEFAULT 86400,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "softwareId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "batchNo" TEXT NOT NULL,
    "importType" "ImportType" NOT NULL DEFAULT 'CSV',
    "fileName" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "actorId" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rawRowIndex" INTEGER NOT NULL,
    "rawPayload" TEXT NOT NULL,
    "parsedName" TEXT NOT NULL,
    "parsedSlug" TEXT,
    "parsedVersion" TEXT,
    "parsedDeveloper" TEXT,
    "parsedUrl" TEXT,
    "parsedCategory" TEXT,
    "parsedLicense" TEXT DEFAULT 'FREE',
    "parsedDescription" TEXT,
    "parsedPlatform" TEXT DEFAULT 'Windows 10/11',
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'NEW_RESOURCE',
    "matchedSoftwareId" TEXT,
    "reviewStatus" "BatchItemReviewStatus" NOT NULL DEFAULT 'PENDING',
    "sourceId" TEXT,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersionCandidate" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "sourceId" TEXT,
    "currentVersion" TEXT,
    "candidateVersion" TEXT NOT NULL,
    "releaseDate" TEXT,
    "changelog" TEXT,
    "sourceUrl" TEXT,
    "downloadUrl" TEXT,
    "platform" TEXT DEFAULT 'Windows 10/11',
    "architecture" TEXT DEFAULT 'x64',
    "discoverySource" TEXT,
    "reviewStatus" "CandidateReviewStatus" NOT NULL DEFAULT 'DISCOVERED',
    "reviewNotes" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkCheckLog" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "healthStatus" "LinkHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "responseTimeMs" INTEGER,
    "redirectUrl" TEXT,
    "isSafeUrl" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkCheckLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceQualityReport" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "details" TEXT NOT NULL,
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceQualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoKeywords" TEXT,
    "seoDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicResource" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "customNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "description" TEXT,
    "cronExpr" TEXT,
    "intervalSec" INTEGER NOT NULL DEFAULT 86400,
    "status" "JobStatus" NOT NULL DEFAULT 'IDLE',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lockToken" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "runNo" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "successItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "logOutput" TEXT,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" "NotificationLevel" NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL,
    "targetUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "normalizedKeyword" TEXT NOT NULL,
    "intent" "KeywordIntent" NOT NULL DEFAULT 'SOFTWARE_DOWNLOAD',
    "topic" TEXT,
    "targetPageType" TEXT,
    "targetPageId" TEXT,
    "status" "KeywordStatus" NOT NULL DEFAULT 'TARGETED',
    "source" TEXT,
    "searchVolume" INTEGER,
    "searchVolumeSource" TEXT,
    "searchVolumeMeasuredAt" TIMESTAMP(3),
    "competition" TEXT,
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoPageAudit" (
    "id" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "targetId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "issuesCount" INTEGER NOT NULL DEFAULT 0,
    "issuesList" TEXT NOT NULL DEFAULT '[]',
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "titleLength" INTEGER NOT NULL DEFAULT 0,
    "descriptionLength" INTEGER NOT NULL DEFAULT 0,
    "hasCanonical" BOOLEAN NOT NULL DEFAULT false,
    "hasSchema" BOOLEAN NOT NULL DEFAULT false,
    "contentWords" INTEGER NOT NULL DEFAULT 0,
    "lastAuditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PASS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoPageAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareComparison" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "targetAudience" TEXT,
    "scenarioGuide" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ComparisonStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareComparisonItem" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "editorNotes" TEXT,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SoftwareComparisonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonAttribute" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "attributeName" TEXT NOT NULL,
    "category" "ComparisonAttributeCategory" NOT NULL DEFAULT 'BASIC',
    "valuesJson" TEXT NOT NULL DEFAULT '{}',
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "evidenceStatus" "EvidenceStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "sourceUrl" TEXT,
    "measuredAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "testEnvironment" TEXT,

    CONSTRAINT "ComparisonAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareAlternative" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "alternativeSoftwareId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "relationType" "AlternativeRelationType" NOT NULL DEFAULT 'SIMILAR_FUNCTION',
    "reviewStatus" "AlternativeReviewStatus" NOT NULL DEFAULT 'APPROVED',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareReview" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "versionUsed" TEXT,
    "operatingSystem" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "isTestReview" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "unhelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCorrection" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "userId" TEXT,
    "correctionType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProviderConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "AiProviderType" NOT NULL DEFAULT 'OPENAI_COMPATIBLE',
    "baseUrl" TEXT,
    "apiKeyEncrypted" TEXT,
    "modelName" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "dailyTokenLimit" INTEGER NOT NULL DEFAULT 100000,
    "usedTokensToday" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "pricingSource" TEXT,
    "pricingUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGenerationTask" (
    "id" TEXT NOT NULL,
    "taskType" "AiTaskType" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "inputContext" TEXT NOT NULL,
    "generatedOutput" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostCny" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "AiTaskStatus" NOT NULL DEFAULT 'AI_DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiGenerationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "taskType" "AiTaskType" NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "pricingModel" TEXT,
    "isEstimatedCost" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQueryLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "hasResults" BOOLEAN NOT NULL DEFAULT true,
    "clickedSoftwareId" TEXT,
    "clientIpHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePageView" (
    "id" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "pageType" TEXT,
    "referer" TEXT,
    "visitorHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberBookmark" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "targetType" "ResourceType" NOT NULL DEFAULT 'SOFTWARE',
    "targetId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MemberUser_email_key" ON "MemberUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberUser_username_key" ON "MemberUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Software_slug_key" ON "Software"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "HostedFile_storageKey_key" ON "HostedFile"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureVerification_fileId_key" ON "SignatureVerification"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutorial_slug_key" ON "Tutorial"("slug");

-- CreateIndex
CREATE INDEX "Tutorial_slug_idx" ON "Tutorial"("slug");

-- CreateIndex
CREATE INDEX "Tutorial_softwareId_idx" ON "Tutorial"("softwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_orderNo_idx" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Entitlement_userId_entitlementType_status_idx" ON "Entitlement"("userId", "entitlementType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_orderId_entitlementType_key" ON "Entitlement"("orderId", "entitlementType");

-- CreateIndex
CREATE INDEX "PaymentLog_orderNo_idx" ON "PaymentLog"("orderNo");

-- CreateIndex
CREATE INDEX "PaymentLog_transactionId_idx" ON "PaymentLog"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentLog_orderNo_status_idx" ON "PaymentLog"("orderNo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DownloadAuthorizationLog_tokenHash_key" ON "DownloadAuthorizationLog"("tokenHash");

-- CreateIndex
CREATE INDEX "DownloadAuthorizationLog_tokenHash_isConsumed_expiresAt_idx" ON "DownloadAuthorizationLog"("tokenHash", "isConsumed", "expiresAt");

-- CreateIndex
CREATE INDEX "DownloadAuthorizationLog_userId_idx" ON "DownloadAuthorizationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundNo_key" ON "Refund"("refundNo");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Refund_userId_idx" ON "Refund"("userId");

-- CreateIndex
CREATE INDEX "SoftwareSource_officialDomain_idx" ON "SoftwareSource"("officialDomain");

-- CreateIndex
CREATE INDEX "SoftwareSource_trustStatus_enabled_idx" ON "SoftwareSource"("trustStatus", "enabled");

-- CreateIndex
CREATE INDEX "SoftwareSource_softwareId_idx" ON "SoftwareSource"("softwareId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_batchNo_key" ON "ImportBatch"("batchNo");

-- CreateIndex
CREATE INDEX "ImportBatch_batchNo_idx" ON "ImportBatch"("batchNo");

-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");

-- CreateIndex
CREATE INDEX "ImportBatchItem_batchId_matchStatus_idx" ON "ImportBatchItem"("batchId", "matchStatus");

-- CreateIndex
CREATE INDEX "ImportBatchItem_reviewStatus_idx" ON "ImportBatchItem"("reviewStatus");

-- CreateIndex
CREATE INDEX "VersionCandidate_softwareId_reviewStatus_idx" ON "VersionCandidate"("softwareId", "reviewStatus");

-- CreateIndex
CREATE INDEX "VersionCandidate_reviewStatus_discoveredAt_idx" ON "VersionCandidate"("reviewStatus", "discoveredAt");

-- CreateIndex
CREATE UNIQUE INDEX "VersionCandidate_softwareId_candidateVersion_platform_archi_key" ON "VersionCandidate"("softwareId", "candidateVersion", "platform", "architecture");

-- CreateIndex
CREATE INDEX "LinkCheckLog_sourceId_checkedAt_idx" ON "LinkCheckLog"("sourceId", "checkedAt");

-- CreateIndex
CREATE INDEX "LinkCheckLog_healthStatus_idx" ON "LinkCheckLog"("healthStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceQualityReport_softwareId_key" ON "ResourceQualityReport"("softwareId");

-- CreateIndex
CREATE INDEX "ResourceQualityReport_completenessScore_idx" ON "ResourceQualityReport"("completenessScore");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_status_sortOrder_idx" ON "Topic"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Topic_slug_idx" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "TopicResource_topicId_sortOrder_idx" ON "TopicResource"("topicId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TopicResource_topicId_softwareId_key" ON "TopicResource"("topicId", "softwareId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_name_key" ON "Job"("name");

-- CreateIndex
CREATE INDEX "Job_jobType_enabled_idx" ON "Job"("jobType", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "JobRun_runNo_key" ON "JobRun"("runNo");

-- CreateIndex
CREATE INDEX "JobRun_jobId_startedAt_idx" ON "JobRun"("jobId", "startedAt");

-- CreateIndex
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");

-- CreateIndex
CREATE INDEX "OperationNotification_isRead_createdAt_idx" ON "OperationNotification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "OperationNotification_category_idx" ON "OperationNotification"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SeoKeyword_keyword_key" ON "SeoKeyword"("keyword");

-- CreateIndex
CREATE INDEX "SeoKeyword_intent_status_idx" ON "SeoKeyword"("intent", "status");

-- CreateIndex
CREATE INDEX "SeoKeyword_priority_idx" ON "SeoKeyword"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SeoPageAudit_pageUrl_key" ON "SeoPageAudit"("pageUrl");

-- CreateIndex
CREATE INDEX "SeoPageAudit_pageType_status_idx" ON "SeoPageAudit"("pageType", "status");

-- CreateIndex
CREATE INDEX "SeoPageAudit_score_idx" ON "SeoPageAudit"("score");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareComparison_slug_key" ON "SoftwareComparison"("slug");

-- CreateIndex
CREATE INDEX "SoftwareComparison_status_updatedAt_idx" ON "SoftwareComparison"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SoftwareComparisonItem_softwareId_idx" ON "SoftwareComparisonItem"("softwareId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareComparisonItem_comparisonId_softwareId_key" ON "SoftwareComparisonItem"("comparisonId", "softwareId");

-- CreateIndex
CREATE INDEX "ComparisonAttribute_comparisonId_sortOrder_idx" ON "ComparisonAttribute"("comparisonId", "sortOrder");

-- CreateIndex
CREATE INDEX "SoftwareAlternative_softwareId_reviewStatus_idx" ON "SoftwareAlternative"("softwareId", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareAlternative_softwareId_alternativeSoftwareId_key" ON "SoftwareAlternative"("softwareId", "alternativeSoftwareId");

-- CreateIndex
CREATE INDEX "SoftwareReview_softwareId_status_createdAt_idx" ON "SoftwareReview"("softwareId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareReview_softwareId_userId_key" ON "SoftwareReview"("softwareId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_userId_key" ON "ReviewVote"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "ReviewReport_status_createdAt_idx" ON "ReviewReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ResourceCorrection_softwareId_status_idx" ON "ResourceCorrection"("softwareId", "status");

-- CreateIndex
CREATE INDEX "AiGenerationTask_taskType_status_idx" ON "AiGenerationTask"("taskType", "status");

-- CreateIndex
CREATE INDEX "AiGenerationTask_targetId_idx" ON "AiGenerationTask"("targetId");

-- CreateIndex
CREATE INDEX "AiUsageLog_taskType_createdAt_idx" ON "AiUsageLog"("taskType", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQueryLog_normalizedQuery_createdAt_idx" ON "SearchQueryLog"("normalizedQuery", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQueryLog_hasResults_idx" ON "SearchQueryLog"("hasResults");

-- CreateIndex
CREATE INDEX "SitePageView_pagePath_createdAt_idx" ON "SitePageView"("pagePath", "createdAt");

-- CreateIndex
CREATE INDEX "SitePageView_createdAt_idx" ON "SitePageView"("createdAt");

-- CreateIndex
CREATE INDEX "MemberBookmark_memberId_idx" ON "MemberBookmark"("memberId");

-- CreateIndex
CREATE INDEX "MemberBookmark_targetType_targetId_idx" ON "MemberBookmark"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberBookmark_memberId_targetType_targetId_key" ON "MemberBookmark"("memberId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Software" ADD CONSTRAINT "Software_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareVersion" ADD CONSTRAINT "SoftwareVersion_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadSource" ADD CONSTRAINT "DownloadSource_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "SoftwareVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadSource" ADD CONSTRAINT "DownloadSource_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "HostedFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceLicense" ADD CONSTRAINT "ResourceLicense_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureVerification" ADD CONSTRAINT "SignatureVerification_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "HostedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadEvent" ADD CONSTRAINT "DownloadEvent_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadEvent" ADD CONSTRAINT "DownloadEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DownloadSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadAuthorizationLog" ADD CONSTRAINT "DownloadAuthorizationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareSource" ADD CONSTRAINT "SoftwareSource_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchItem" ADD CONSTRAINT "ImportBatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatchItem" ADD CONSTRAINT "ImportBatchItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SoftwareSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionCandidate" ADD CONSTRAINT "VersionCandidate_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersionCandidate" ADD CONSTRAINT "VersionCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SoftwareSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkCheckLog" ADD CONSTRAINT "LinkCheckLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DownloadSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceQualityReport" ADD CONSTRAINT "ResourceQualityReport_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicResource" ADD CONSTRAINT "TopicResource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicResource" ADD CONSTRAINT "TopicResource_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRun" ADD CONSTRAINT "JobRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareComparisonItem" ADD CONSTRAINT "SoftwareComparisonItem_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "SoftwareComparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareComparisonItem" ADD CONSTRAINT "SoftwareComparisonItem_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonAttribute" ADD CONSTRAINT "ComparisonAttribute_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "SoftwareComparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareAlternative" ADD CONSTRAINT "SoftwareAlternative_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareAlternative" ADD CONSTRAINT "SoftwareAlternative_alternativeSoftwareId_fkey" FOREIGN KEY ("alternativeSoftwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareReview" ADD CONSTRAINT "SoftwareReview_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareReview" ADD CONSTRAINT "SoftwareReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SoftwareReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SoftwareReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCorrection" ADD CONSTRAINT "ResourceCorrection_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCorrection" ADD CONSTRAINT "ResourceCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberBookmark" ADD CONSTRAINT "MemberBookmark_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

