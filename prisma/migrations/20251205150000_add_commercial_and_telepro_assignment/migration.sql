-- Ajouter les nouvelles colonnes
ALTER TABLE "contact" ADD COLUMN "assignedCommercialId" TEXT;
ALTER TABLE "contact" ADD COLUMN "assignedTeleproId" TEXT;

-- Migrer les données existantes : assigner les contacts existants au commercial
-- (on suppose que les utilisateurs assignés actuellement sont des commerciaux)
UPDATE "contact" SET "assignedCommercialId" = "assignedUserId" WHERE "assignedUserId" IS NOT NULL;

-- Créer les index
CREATE INDEX IF NOT EXISTS "contact_assignedCommercialId_idx" ON "contact"("assignedCommercialId");
CREATE INDEX IF NOT EXISTS "contact_assignedTeleproId_idx" ON "contact"("assignedTeleproId");

-- Ajouter les contraintes de clé étrangère
ALTER TABLE "contact" ADD CONSTRAINT "contact_assignedCommercialId_fkey" FOREIGN KEY ("assignedCommercialId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contact" ADD CONSTRAINT "contact_assignedTeleproId_fkey" FOREIGN KEY ("assignedTeleproId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supprimer l'ancienne colonne et son index
DROP INDEX IF EXISTS "contact_assignedUserId_idx";
ALTER TABLE "contact" DROP CONSTRAINT IF EXISTS "contact_assignedUserId_fkey";
ALTER TABLE "contact" DROP COLUMN "assignedUserId";

