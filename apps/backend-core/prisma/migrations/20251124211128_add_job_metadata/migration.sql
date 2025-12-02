-- CreateEnum
CREATE TYPE "JobPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "headcount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" "JobPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "remoteType" "RemoteType" NOT NULL DEFAULT 'HYBRID',
ADD COLUMN     "targetHireDate" TIMESTAMP(3);
