-- AlterTable
ALTER TABLE "task" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "googleMeetLink" TEXT;

-- CreateTable
CREATE TABLE "user_google_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_google_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_google_account_userId_key" ON "user_google_account"("userId");

-- CreateIndex
CREATE INDEX "task_googleEventId_idx" ON "task"("googleEventId");

-- AddForeignKey
ALTER TABLE "user_google_account" ADD CONSTRAINT "user_google_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
