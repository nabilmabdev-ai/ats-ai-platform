-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "region" TEXT,
ADD COLUMN     "screeningTemplateId" TEXT,
ADD COLUMN     "workflowTemplateId" TEXT;

-- CreateTable
CREATE TABLE "JobWorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "jobFamily" TEXT,
    "defaultStages" JSONB NOT NULL,
    "automations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobWorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiredSkills" JSONB,
    "niceToHaves" JSONB,
    "scoringWeights" JSONB,
    "interviewQuestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalTemplate" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "JobWorkflowTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_screeningTemplateId_fkey" FOREIGN KEY ("screeningTemplateId") REFERENCES "ScreeningTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
