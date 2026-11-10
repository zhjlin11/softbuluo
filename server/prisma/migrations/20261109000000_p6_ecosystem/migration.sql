-- CreateEnum
CREATE TYPE "DeveloperVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ClaimMethod" AS ENUM ('DNS_TXT', 'WELL_KNOWN_FILE', 'GITHUB_AUTH', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "DiscussionCategory" AS ENUM ('EXPERIENCE', 'INSTALL_ISSUE', 'QUESTION', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "DiscussionStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ApiKeyTier" AS ENUM ('TIER_BASIC', 'TIER_DEVELOPER');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "ResourceReviewEvidence" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "observedValue" TEXT,
    "verificationStatus" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ResourceReviewEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "memberUserId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationName" TEXT,
    "website" TEXT,
    "githubUsername" TEXT,
    "bio" TEXT,
    "verificationStatus" "DeveloperVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperSubmission" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "officialWebsite" TEXT NOT NULL,
    "repoUrl" TEXT,
    "version" TEXT NOT NULL,
    "license" TEXT NOT NULL DEFAULT 'FREE',
    "releaseDate" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changelog" TEXT,
    "iconUrl" TEXT,
    "downloadUrl" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareClaim" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "claimMethod" "ClaimMethod" NOT NULL DEFAULT 'DNS_TXT',
    "challengeCode" TEXT NOT NULL,
    "verificationTarget" TEXT,
    "evidenceUrl" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionThread" (
    "id" TEXT NOT NULL,
    "softwareId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "DiscussionCategory" NOT NULL DEFAULT 'EXPERIENCE',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "status" "DiscussionStatus" NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentPostId" TEXT,
    "content" TEXT NOT NULL,
    "isDeveloperReply" BOOLEAN NOT NULL DEFAULT false,
    "status" "DiscussionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReport" (
    "id" TEXT NOT NULL,
    "threadId" TEXT,
    "postId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperApiKey" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "rateLimitTier" "ApiKeyTier" NOT NULL DEFAULT 'TIER_DEVELOPER',
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsageRecord" (
    "id" TEXT NOT NULL,
    "keyId" TEXT,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceReviewEvidence_resourceId_idx" ON "ResourceReviewEvidence"("resourceId");

-- CreateIndex
CREATE INDEX "ResourceReviewEvidence_evidenceType_idx" ON "ResourceReviewEvidence"("evidenceType");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_memberUserId_key" ON "DeveloperProfile"("memberUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_slug_key" ON "DeveloperProfile"("slug");

-- CreateIndex
CREATE INDEX "DeveloperProfile_verificationStatus_idx" ON "DeveloperProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "DeveloperSubmission_developerId_idx" ON "DeveloperSubmission"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperSubmission_status_idx" ON "DeveloperSubmission"("status");

-- CreateIndex
CREATE INDEX "SoftwareClaim_developerId_idx" ON "SoftwareClaim"("developerId");

-- CreateIndex
CREATE INDEX "SoftwareClaim_softwareId_idx" ON "SoftwareClaim"("softwareId");

-- CreateIndex
CREATE INDEX "SoftwareClaim_status_idx" ON "SoftwareClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SoftwareClaim_softwareId_developerId_key" ON "SoftwareClaim"("softwareId", "developerId");

-- CreateIndex
CREATE INDEX "DiscussionThread_softwareId_idx" ON "DiscussionThread"("softwareId");

-- CreateIndex
CREATE INDEX "DiscussionThread_userId_idx" ON "DiscussionThread"("userId");

-- CreateIndex
CREATE INDEX "DiscussionThread_status_createdAt_idx" ON "DiscussionThread"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionPost_threadId_idx" ON "DiscussionPost"("threadId");

-- CreateIndex
CREATE INDEX "DiscussionPost_userId_idx" ON "DiscussionPost"("userId");

-- CreateIndex
CREATE INDEX "DiscussionReport_reporterId_idx" ON "DiscussionReport"("reporterId");

-- CreateIndex
CREATE INDEX "DiscussionReport_status_idx" ON "DiscussionReport"("status");

-- CreateIndex
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperApiKey_keyHash_key" ON "DeveloperApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "DeveloperApiKey_developerId_idx" ON "DeveloperApiKey"("developerId");

-- CreateIndex
CREATE INDEX "DeveloperApiKey_status_idx" ON "DeveloperApiKey"("status");

-- CreateIndex
CREATE INDEX "ApiUsageRecord_timestamp_idx" ON "ApiUsageRecord"("timestamp");

-- CreateIndex
CREATE INDEX "ApiUsageRecord_keyId_idx" ON "ApiUsageRecord"("keyId");

-- CreateIndex
CREATE INDEX "ApiUsageRecord_ip_idx" ON "ApiUsageRecord"("ip");

-- AddForeignKey
ALTER TABLE "ResourceReviewEvidence" ADD CONSTRAINT "ResourceReviewEvidence_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperProfile" ADD CONSTRAINT "DeveloperProfile_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperSubmission" ADD CONSTRAINT "DeveloperSubmission_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareClaim" ADD CONSTRAINT "SoftwareClaim_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftwareClaim" ADD CONSTRAINT "SoftwareClaim_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_softwareId_fkey" FOREIGN KEY ("softwareId") REFERENCES "Software"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DiscussionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionPost" ADD CONSTRAINT "DiscussionPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReport" ADD CONSTRAINT "DiscussionReport_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DiscussionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReport" ADD CONSTRAINT "DiscussionReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReport" ADD CONSTRAINT "DiscussionReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "MemberUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperApiKey" ADD CONSTRAINT "DeveloperApiKey_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
