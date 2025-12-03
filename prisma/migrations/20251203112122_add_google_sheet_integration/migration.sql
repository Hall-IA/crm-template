-- CreateTable
CREATE TABLE "google_sheet_sync_config" (
    "id" TEXT NOT NULL DEFAULT 'google_sheet_sync_config_singleton',
    "ownerUserId" TEXT NOT NULL,
    "spreadsheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "headerRow" INTEGER NOT NULL,
    "phoneColumn" TEXT NOT NULL,
    "firstNameColumn" TEXT,
    "lastNameColumn" TEXT,
    "emailColumn" TEXT,
    "cityColumn" TEXT,
    "postalCodeColumn" TEXT,
    "originColumn" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedRow" INTEGER,
    "defaultStatusId" TEXT,
    "defaultAssignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_sheet_sync_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "google_sheet_sync_config" ADD CONSTRAINT "google_sheet_sync_config_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheet_sync_config" ADD CONSTRAINT "google_sheet_sync_config_defaultStatusId_fkey" FOREIGN KEY ("defaultStatusId") REFERENCES "status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_sheet_sync_config" ADD CONSTRAINT "google_sheet_sync_config_defaultAssignedUserId_fkey" FOREIGN KEY ("defaultAssignedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
