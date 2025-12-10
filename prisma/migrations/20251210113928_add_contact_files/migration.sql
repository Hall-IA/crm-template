-- CreateTable
CREATE TABLE "contact_file" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "googleDriveFileId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_file_contactId_idx" ON "contact_file"("contactId");

-- CreateIndex
CREATE INDEX "contact_file_uploadedById_idx" ON "contact_file"("uploadedById");

-- AddForeignKey
ALTER TABLE "contact_file" ADD CONSTRAINT "contact_file_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_file" ADD CONSTRAINT "contact_file_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
