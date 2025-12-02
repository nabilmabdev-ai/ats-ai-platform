/*
  Warnings:

  - A unique constraint covering the columns `[interviewerId,confirmedSlot]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "aiParsingError" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "confirmedSlot" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_interviewerId_confirmedSlot_key" ON "Interview"("interviewerId", "confirmedSlot");
