-- CreateTable
CREATE TABLE "google_ads_lead_config" (
    "id" TEXT NOT NULL DEFAULT 'google_ads_lead_config_singleton',
    "webhookKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultStatusId" TEXT,
    "defaultAssignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_ads_lead_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "google_ads_lead_config" ADD CONSTRAINT "google_ads_lead_config_defaultStatusId_fkey" FOREIGN KEY ("defaultStatusId") REFERENCES "status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_ads_lead_config" ADD CONSTRAINT "google_ads_lead_config_defaultAssignedUserId_fkey" FOREIGN KEY ("defaultAssignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
