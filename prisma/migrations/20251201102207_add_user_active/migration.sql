-- CreateEnum
CREATE TYPE "Civility" AS ENUM ('M', 'MME', 'MLLE');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'SMS', 'EMAIL', 'MEETING', 'NOTE');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "civility" "Civility",
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "origin" TEXT,
    "statusId" TEXT,
    "assignedUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_statusId_idx" ON "contact"("statusId");

-- CreateIndex
CREATE INDEX "contact_assignedUserId_idx" ON "contact"("assignedUserId");

-- CreateIndex
CREATE INDEX "contact_createdById_idx" ON "contact"("createdById");

-- CreateIndex
CREATE INDEX "interaction_contactId_idx" ON "interaction"("contactId");

-- CreateIndex
CREATE INDEX "interaction_userId_idx" ON "interaction"("userId");

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction" ADD CONSTRAINT "interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
