-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "isAutoRejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "knockoutAnswers" JSONB;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "knockoutQuestions" JSONB;
