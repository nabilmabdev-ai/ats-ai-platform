-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "defaultDepartment" TEXT,
    "defaultLocation" TEXT,
    "defaultRemoteType" "RemoteType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "JobTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
