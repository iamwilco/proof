/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'PROPOSER', 'REVIEWER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'PROJECT');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('TEAM_MEMBER', 'FOUNDER', 'ADVISOR', 'EMPLOYEE', 'PARTNER', 'CONTRACTOR', 'INVESTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('CONSIDERING', 'PLANNED', 'IN_PROGRESS', 'SHIPPED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "AuthNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "stakeAddress" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminConnection" (
    "id" TEXT NOT NULL,
    "sourceType" "EntityType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" "EntityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "connectionType" "ConnectionType" NOT NULL,
    "evidence" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'CONSIDERING',
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureVote" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthNonce_nonce_key" ON "AuthNonce"("nonce");

-- CreateIndex
CREATE INDEX "AuthNonce_stakeAddress_idx" ON "AuthNonce"("stakeAddress");

-- CreateIndex
CREATE INDEX "AdminConnection_sourceType_sourceId_idx" ON "AdminConnection"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "AdminConnection_targetType_targetId_idx" ON "AdminConnection"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminConnection_sourceType_sourceId_targetType_targetId_con_key" ON "AdminConnection"("sourceType", "sourceId", "targetType", "targetId", "connectionType");

-- CreateIndex
CREATE INDEX "Feature_status_idx" ON "Feature"("status");

-- CreateIndex
CREATE INDEX "FeatureVote_userId_idx" ON "FeatureVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureVote_featureId_userId_key" ON "FeatureVote"("featureId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "FeatureVote" ADD CONSTRAINT "FeatureVote_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
