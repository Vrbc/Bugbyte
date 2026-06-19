-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DEVELOPER', 'TESTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'CASUAL', 'EXPERIENCED', 'QA_ORIENTED');

-- CreateEnum
CREATE TYPE "TesterLevel" AS ENUM ('NEW_TESTER', 'RELIABLE_TESTER', 'TRUSTED_TESTER', 'EXPERT_TESTER', 'ELITE_TESTER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'TESTING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('FIRST_IMPRESSION', 'BUG_HUNT', 'BALANCE_TEST', 'TUTORIAL_CLARITY', 'PERFORMANCE_CHECK', 'UX_FEEDBACK');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('LIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'CONFUSION', 'SUGGESTION', 'POSITIVE', 'DIFFICULTY_SPIKE', 'COMMENT');

-- CreateEnum
CREATE TYPE "FeedbackSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studioName" TEXT NOT NULL,
    "bio" TEXT,
    "websiteUrl" TEXT,

    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platforms" TEXT[],
    "favoriteGenres" TEXT[],
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "level" "TesterLevel" NOT NULL DEFAULT 'NEW_TESTER',

    CONSTRAINT "TesterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "platforms" TEXT[],
    "coverImageUrl" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBuild" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "buildUrl" TEXT NOT NULL,
    "changelog" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaytestCampaign" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "requiredTesters" INTEGER NOT NULL,
    "minTesterRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredPlatforms" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaytestCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignApplication" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" "SessionStatus" NOT NULL DEFAULT 'LIVE',
    "finalFunRating" INTEGER,
    "finalDifficultyRating" INTEGER,
    "finalClarityRating" INTEGER,
    "finalComment" TEXT,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackByte" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "timestampSeconds" INTEGER NOT NULL,
    "severity" "FeedbackSeverity",
    "comment" TEXT NOT NULL,
    "reproductionSteps" TEXT,
    "screenshotUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackByte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesterReview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "testerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TesterReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_userId_key" ON "DeveloperProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TesterProfile_userId_key" ON "TesterProfile"("userId");

-- CreateIndex
CREATE INDEX "Game_developerId_idx" ON "Game"("developerId");

-- CreateIndex
CREATE INDEX "GameBuild_gameId_idx" ON "GameBuild"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameBuild_gameId_version_key" ON "GameBuild"("gameId", "version");

-- CreateIndex
CREATE INDEX "PlaytestCampaign_gameId_idx" ON "PlaytestCampaign"("gameId");

-- CreateIndex
CREATE INDEX "PlaytestCampaign_buildId_idx" ON "PlaytestCampaign"("buildId");

-- CreateIndex
CREATE INDEX "PlaytestCampaign_developerId_idx" ON "PlaytestCampaign"("developerId");

-- CreateIndex
CREATE INDEX "PlaytestCampaign_status_idx" ON "PlaytestCampaign"("status");

-- CreateIndex
CREATE INDEX "CampaignApplication_campaignId_idx" ON "CampaignApplication"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignApplication_testerId_idx" ON "CampaignApplication"("testerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignApplication_campaignId_testerId_key" ON "CampaignApplication"("campaignId", "testerId");

-- CreateIndex
CREATE UNIQUE INDEX "TestSession_applicationId_key" ON "TestSession"("applicationId");

-- CreateIndex
CREATE INDEX "TestSession_campaignId_idx" ON "TestSession"("campaignId");

-- CreateIndex
CREATE INDEX "TestSession_testerId_idx" ON "TestSession"("testerId");

-- CreateIndex
CREATE INDEX "TestSession_status_idx" ON "TestSession"("status");

-- CreateIndex
CREATE INDEX "FeedbackByte_sessionId_idx" ON "FeedbackByte"("sessionId");

-- CreateIndex
CREATE INDEX "FeedbackByte_testerId_idx" ON "FeedbackByte"("testerId");

-- CreateIndex
CREATE INDEX "FeedbackByte_type_idx" ON "FeedbackByte"("type");

-- CreateIndex
CREATE UNIQUE INDEX "TesterReview_sessionId_key" ON "TesterReview"("sessionId");

-- CreateIndex
CREATE INDEX "TesterReview_developerId_idx" ON "TesterReview"("developerId");

-- CreateIndex
CREATE INDEX "TesterReview_testerId_idx" ON "TesterReview"("testerId");

-- AddForeignKey
ALTER TABLE "DeveloperProfile" ADD CONSTRAINT "DeveloperProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesterProfile" ADD CONSTRAINT "TesterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBuild" ADD CONSTRAINT "GameBuild_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestCampaign" ADD CONSTRAINT "PlaytestCampaign_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestCampaign" ADD CONSTRAINT "PlaytestCampaign_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "GameBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestCampaign" ADD CONSTRAINT "PlaytestCampaign_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PlaytestCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "PlaytestCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CampaignApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackByte" ADD CONSTRAINT "FeedbackByte_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackByte" ADD CONSTRAINT "FeedbackByte_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesterReview" ADD CONSTRAINT "TesterReview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesterReview" ADD CONSTRAINT "TesterReview_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesterReview" ADD CONSTRAINT "TesterReview_testerId_fkey" FOREIGN KEY ("testerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
