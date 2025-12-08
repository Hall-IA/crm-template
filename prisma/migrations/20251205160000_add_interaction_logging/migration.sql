-- AlterEnum
-- Ajouter les nouveaux types d'interactions à l'enum existant
ALTER TYPE "InteractionType" ADD VALUE IF NOT EXISTS 'STATUS_CHANGE';
ALTER TYPE "InteractionType" ADD VALUE IF NOT EXISTS 'CONTACT_UPDATE';
ALTER TYPE "InteractionType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CREATED';
ALTER TYPE "InteractionType" ADD VALUE IF NOT EXISTS 'ASSIGNMENT_CHANGE';

-- AlterTable
-- Ajouter le champ metadata à la table interaction
ALTER TABLE "interaction" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

