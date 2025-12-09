-- CreateTable
CREATE TABLE "email_tracking" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_tracking_interactionId_key" ON "email_tracking"("interactionId");

-- CreateIndex
CREATE INDEX "email_tracking_interactionId_idx" ON "email_tracking"("interactionId");

-- AddForeignKey
ALTER TABLE "email_tracking" ADD CONSTRAINT "email_tracking_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
