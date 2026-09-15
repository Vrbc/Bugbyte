-- AlterTable
ALTER TABLE "TestSession" ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedDurationSeconds" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PAUSED';
