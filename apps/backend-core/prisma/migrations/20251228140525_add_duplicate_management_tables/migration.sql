-- CreateEnum
CREATE TYPE "DuplicateStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "DuplicateGroup" (
    "id" TEXT NOT NULL,
    "status" "DuplicateStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuplicateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "matchReason" JSONB,
    "confidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateExclusion" (
    "id" TEXT NOT NULL,
    "candidateAId" TEXT NOT NULL,
    "candidateBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateGroupMember_groupId_candidateId_key" ON "DuplicateGroupMember"("groupId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateExclusion_candidateAId_candidateBId_key" ON "DuplicateExclusion"("candidateAId", "candidateBId");

-- AddForeignKey
ALTER TABLE "DuplicateGroupMember" ADD CONSTRAINT "DuplicateGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DuplicateGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateGroupMember" ADD CONSTRAINT "DuplicateGroupMember_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateExclusion" ADD CONSTRAINT "DuplicateExclusion_candidateAId_fkey" FOREIGN KEY ("candidateAId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateExclusion" ADD CONSTRAINT "DuplicateExclusion_candidateBId_fkey" FOREIGN KEY ("candidateBId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
