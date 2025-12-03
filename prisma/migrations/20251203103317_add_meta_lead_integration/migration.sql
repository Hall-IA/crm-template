-- CreateTable
CREATE TABLE "meta_lead_config" (
    "id" TEXT NOT NULL DEFAULT 'meta_lead_config_singleton',
    "pageId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultStatusId" TEXT,
    "defaultAssignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_lead_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meta_lead_config" ADD CONSTRAINT "meta_lead_config_defaultStatusId_fkey" FOREIGN KEY ("defaultStatusId") REFERENCES "status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_lead_config" ADD CONSTRAINT "meta_lead_config_defaultAssignedUserId_fkey" FOREIGN KEY ("defaultAssignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
