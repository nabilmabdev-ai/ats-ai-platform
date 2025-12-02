-- CreateEnum
CREATE TYPE "ESignStatus" AS ENUM ('SENT', 'VIEWED', 'SIGNED', 'DECLINED');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "eSignProviderId" TEXT,
ADD COLUMN     "eSignStatus" "ESignStatus",
ADD COLUMN     "signedDocumentUrl" TEXT,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
