-- AlterTable
ALTER TABLE "user" ADD COLUMN     "customRoleId" TEXT;

-- CreateTable
CREATE TABLE "custom_role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_role_name_key" ON "custom_role"("name");

-- CreateIndex
CREATE INDEX "user_customRoleId_idx" ON "user"("customRoleId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
