-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "aiTone" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "JobTemplate" ADD COLUMN     "aiTone" TEXT,
ADD COLUMN     "structureJson" JSONB;
