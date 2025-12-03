-- AlterEnum
ALTER TYPE "AppStatus" ADD VALUE 'SOURCED';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "enableAutoMerge" BOOLEAN NOT NULL DEFAULT false;
