-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InteractionType" ADD VALUE 'STATUS_CHANGED';
ALTER TYPE "InteractionType" ADD VALUE 'INFO_UPDATED';
ALTER TYPE "InteractionType" ADD VALUE 'ASSIGNMENT_CHANGED';
ALTER TYPE "InteractionType" ADD VALUE 'CONTACT_CREATED';
