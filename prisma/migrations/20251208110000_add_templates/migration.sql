-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('EMAIL', 'SMS', 'NOTE');

-- CreateTable
CREATE TABLE IF NOT EXISTS "template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "template_userId_idx" ON "template"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "template_type_idx" ON "template"("type");

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

