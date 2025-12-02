-- AlterTable
ALTER TABLE "JobTemplate" ADD COLUMN     "defaultScreeningTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "JobTemplate" ADD CONSTRAINT "JobTemplate_defaultScreeningTemplateId_fkey" FOREIGN KEY ("defaultScreeningTemplateId") REFERENCES "ScreeningTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
