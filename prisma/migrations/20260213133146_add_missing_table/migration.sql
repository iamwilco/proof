-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "catalystMilestoneId" TEXT,
ADD COLUMN     "evidenceUrls" TEXT[],
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "paymentTxHash" TEXT,
ADD COLUMN     "poaApprovedAt" TIMESTAMP(3),
ADD COLUMN     "poaStatus" TEXT,
ADD COLUMN     "poaSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "reviewerFeedback" TEXT,
ADD COLUMN     "somStatus" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubActivityScore" INTEGER,
ADD COLUMN     "githubLastSync" TIMESTAMP(3),
ADD COLUMN     "githubOwner" TEXT,
ADD COLUMN     "githubRepo" TEXT,
ADD COLUMN     "githubUrl" TEXT;

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "reporterName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "progress" TEXT,
    "blockers" TEXT,
    "nextSteps" TEXT,
    "evidenceUrls" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "alignmentScore" INTEGER,
    "feasibilityScore" INTEGER,
    "auditabilityScore" INTEGER,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountabilityScore" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "completionScore" INTEGER NOT NULL,
    "deliveryScore" INTEGER NOT NULL,
    "communityScore" INTEGER NOT NULL,
    "efficiencyScore" INTEGER NOT NULL,
    "communicationScore" INTEGER NOT NULL,
    "badge" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountabilityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotingRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "yesVotes" INTEGER NOT NULL,
    "noVotes" INTEGER NOT NULL,
    "abstainVotes" INTEGER NOT NULL,
    "uniqueWallets" INTEGER NOT NULL,
    "approvalRate" DOUBLE PRECISION NOT NULL,
    "fundingProbability" DOUBLE PRECISION NOT NULL,
    "fundRank" INTEGER,
    "categoryRank" INTEGER,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VotingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "metadata" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityProject" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionNFT" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "policyId" TEXT,
    "assetId" TEXT,
    "assetName" TEXT,
    "metadataJson" JSONB,
    "imageUrl" TEXT,
    "mintTxHash" TEXT,
    "mintedAt" TIMESTAMP(3),
    "mintStatus" TEXT NOT NULL DEFAULT 'pending',
    "mintError" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifierWallet" TEXT,
    "proposerWallet" TEXT,
    "walletVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionNFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'like',
    "listId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookmarkList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingTransaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" DECIMAL(20,6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ADA',
    "usdValueAtTime" DECIMAL(20,2),
    "adaPrice" DECIMAL(10,4),
    "fromAddress" TEXT,
    "toAddress" TEXT NOT NULL,
    "txDate" TIMESTAMP(3) NOT NULL,
    "blockHeight" INTEGER,
    "epoch" INTEGER,
    "slot" INTEGER,
    "txType" TEXT NOT NULL DEFAULT 'funding',
    "milestoneId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "explorerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAddress" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerId" TEXT,
    "personId" TEXT,
    "organizationId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "signatureNonce" TEXT,
    "label" TEXT,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "totalReceived" DECIMAL(20,6),
    "totalSent" DECIMAL(20,6),
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideascaleId" TEXT,
    "ideascaleUsername" TEXT,
    "fundsParticipated" TEXT[],
    "proposalsReviewed" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DECIMAL(3,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVeteran" BOOLEAN NOT NULL DEFAULT false,
    "badges" TEXT[],
    "reviewQualityScore" DECIMAL(3,2),
    "flaggedReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeratorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'moderator',
    "scope" TEXT[],
    "actionsCount" INTEGER NOT NULL DEFAULT 0,
    "flagsResolved" INTEGER NOT NULL DEFAULT 0,
    "reportsHandled" INTEGER NOT NULL DEFAULT 0,
    "warningsIssued" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appointedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appointedBy" TEXT,
    "badges" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeratorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyReport_projectId_year_month_idx" ON "MonthlyReport"("projectId", "year", "month");

-- CreateIndex
CREATE INDEX "MonthlyReport_year_month_idx" ON "MonthlyReport"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Review_projectId_createdAt_idx" ON "Review"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_createdAt_idx" ON "Review"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewVote_userId_createdAt_idx" ON "ReviewVote"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_userId_key" ON "ReviewVote"("reviewId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountabilityScore_personId_key" ON "AccountabilityScore"("personId");

-- CreateIndex
CREATE INDEX "AccountabilityScore_badge_idx" ON "AccountabilityScore"("badge");

-- CreateIndex
CREATE INDEX "VotingRecord_fundId_category_idx" ON "VotingRecord"("fundId", "category");

-- CreateIndex
CREATE INDEX "VotingRecord_projectId_idx" ON "VotingRecord"("projectId");

-- CreateIndex
CREATE INDEX "Flag_projectId_status_idx" ON "Flag"("projectId", "status");

-- CreateIndex
CREATE INDEX "Flag_type_status_idx" ON "Flag"("type", "status");

-- CreateIndex
CREATE INDEX "Flag_category_idx" ON "Flag"("category");

-- CreateIndex
CREATE INDEX "Flag_createdAt_idx" ON "Flag"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_slug_idx" ON "Community"("slug");

-- CreateIndex
CREATE INDEX "Community_createdById_idx" ON "Community"("createdById");

-- CreateIndex
CREATE INDEX "CommunityProject_communityId_idx" ON "CommunityProject"("communityId");

-- CreateIndex
CREATE INDEX "CommunityProject_projectId_idx" ON "CommunityProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityProject_communityId_projectId_key" ON "CommunityProject"("communityId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionNFT_projectId_key" ON "CompletionNFT"("projectId");

-- CreateIndex
CREATE INDEX "CompletionNFT_mintStatus_idx" ON "CompletionNFT"("mintStatus");

-- CreateIndex
CREATE INDEX "CompletionNFT_verificationStatus_idx" ON "CompletionNFT"("verificationStatus");

-- CreateIndex
CREATE INDEX "Bookmark_userId_idx" ON "Bookmark"("userId");

-- CreateIndex
CREATE INDEX "Bookmark_projectId_idx" ON "Bookmark"("projectId");

-- CreateIndex
CREATE INDEX "Bookmark_listId_idx" ON "Bookmark"("listId");

-- CreateIndex
CREATE INDEX "Bookmark_action_idx" ON "Bookmark"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_projectId_key" ON "Bookmark"("userId", "projectId");

-- CreateIndex
CREATE INDEX "BookmarkList_userId_idx" ON "BookmarkList"("userId");

-- CreateIndex
CREATE INDEX "BookmarkList_isPublic_idx" ON "BookmarkList"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkList_userId_name_key" ON "BookmarkList"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FundingTransaction_txHash_key" ON "FundingTransaction"("txHash");

-- CreateIndex
CREATE INDEX "FundingTransaction_projectId_idx" ON "FundingTransaction"("projectId");

-- CreateIndex
CREATE INDEX "FundingTransaction_txDate_idx" ON "FundingTransaction"("txDate");

-- CreateIndex
CREATE INDEX "FundingTransaction_txType_idx" ON "FundingTransaction"("txType");

-- CreateIndex
CREATE INDEX "FundingTransaction_toAddress_idx" ON "FundingTransaction"("toAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAddress_address_key" ON "WalletAddress"("address");

-- CreateIndex
CREATE INDEX "WalletAddress_ownerId_idx" ON "WalletAddress"("ownerId");

-- CreateIndex
CREATE INDEX "WalletAddress_personId_idx" ON "WalletAddress"("personId");

-- CreateIndex
CREATE INDEX "WalletAddress_verified_idx" ON "WalletAddress"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_userId_key" ON "ReviewerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_ideascaleId_key" ON "ReviewerProfile"("ideascaleId");

-- CreateIndex
CREATE INDEX "ReviewerProfile_isActive_idx" ON "ReviewerProfile"("isActive");

-- CreateIndex
CREATE INDEX "ReviewerProfile_isVeteran_idx" ON "ReviewerProfile"("isVeteran");

-- CreateIndex
CREATE UNIQUE INDEX "ModeratorProfile_userId_key" ON "ModeratorProfile"("userId");

-- CreateIndex
CREATE INDEX "ModeratorProfile_role_idx" ON "ModeratorProfile"("role");

-- CreateIndex
CREATE INDEX "ModeratorProfile_isActive_idx" ON "ModeratorProfile"("isActive");

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountabilityScore" ADD CONSTRAINT "AccountabilityScore_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingRecord" ADD CONSTRAINT "VotingRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotingRecord" ADD CONSTRAINT "VotingRecord_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concern" ADD CONSTRAINT "Concern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectClaim" ADD CONSTRAINT "ProjectClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcernResponse" ADD CONSTRAINT "ConcernResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reputation" ADD CONSTRAINT "Reputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationEvent" ADD CONSTRAINT "ReputationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityProject" ADD CONSTRAINT "CommunityProject_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityProject" ADD CONSTRAINT "CommunityProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionNFT" ADD CONSTRAINT "CompletionNFT_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_listId_fkey" FOREIGN KEY ("listId") REFERENCES "BookmarkList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkList" ADD CONSTRAINT "BookmarkList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundingTransaction" ADD CONSTRAINT "FundingTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAddress" ADD CONSTRAINT "WalletAddress_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewerProfile" ADD CONSTRAINT "ReviewerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeratorProfile" ADD CONSTRAINT "ModeratorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
