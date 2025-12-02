/*
  Warnings:

  - A unique constraint covering the columns `[bookingToken]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "bookingToken" TEXT,
ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availability" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Interview_bookingToken_key" ON "Interview"("bookingToken");
