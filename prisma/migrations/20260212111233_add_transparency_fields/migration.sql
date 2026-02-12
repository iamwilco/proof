/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Fund` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,organizationId]` on the table `ProjectOrganization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,personId]` on the table `ProjectPerson` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Fund" ADD COLUMN     "completedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fundedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "proposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "totalAwarded" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalDistributed" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "completedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fundedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "heroImgUrl" TEXT,
ADD COLUMN     "proposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmountAwarded" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmountReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "completedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fundedProposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "heroImgUrl" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "proposalsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmountAwarded" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmountReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmountRequested" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "amountReceived" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fundedAt" TIMESTAMP(3),
ADD COLUMN     "fundingStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "noVotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "problem" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "solution" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yesVotes" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "fundingAmount" SET DATA TYPE DECIMAL(18,2);

-- AlterTable
ALTER TABLE "ProjectPerson" ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PersonOrganization" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonOrganization_personId_organizationId_key" ON "PersonOrganization"("personId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_externalId_key" ON "Fund"("externalId");

-- CreateIndex
CREATE INDEX "Fund_externalId_idx" ON "Fund"("externalId");

-- CreateIndex
CREATE INDEX "Fund_number_idx" ON "Fund"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_externalId_key" ON "Organization"("externalId");

-- CreateIndex
CREATE INDEX "Organization_externalId_idx" ON "Organization"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_externalId_key" ON "Person"("externalId");

-- CreateIndex
CREATE INDEX "Person_externalId_idx" ON "Person"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_externalId_key" ON "Project"("externalId");

-- CreateIndex
CREATE INDEX "Project_externalId_idx" ON "Project"("externalId");

-- CreateIndex
CREATE INDEX "Project_fundingStatus_idx" ON "Project"("fundingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectOrganization_projectId_organizationId_key" ON "ProjectOrganization"("projectId", "organizationId");

-- CreateIndex
CREATE INDEX "ProjectPerson_personId_idx" ON "ProjectPerson"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPerson_projectId_personId_key" ON "ProjectPerson"("projectId", "personId");

-- AddForeignKey
ALTER TABLE "PersonOrganization" ADD CONSTRAINT "PersonOrganization_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonOrganization" ADD CONSTRAINT "PersonOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
