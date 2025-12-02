-- CreateEnum
CREATE TYPE "ScorecardType" AS ENUM ('HUMAN', 'AI');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "scorecardType" "ScorecardType";
