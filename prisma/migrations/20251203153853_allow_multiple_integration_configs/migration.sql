-- Ajouter la colonne name avec une valeur par défaut temporaire
ALTER TABLE "google_ads_lead_config" ADD COLUMN "name" TEXT;
ALTER TABLE "google_sheet_sync_config" ADD COLUMN "name" TEXT;
ALTER TABLE "meta_lead_config" ADD COLUMN "name" TEXT;

-- Mettre à jour les valeurs existantes avec un nom par défaut
UPDATE "google_ads_lead_config" SET "name" = 'Configuration Google Ads' WHERE "name" IS NULL;
UPDATE "google_sheet_sync_config" SET "name" = 'Configuration Google Sheets' WHERE "name" IS NULL;
UPDATE "meta_lead_config" SET "name" = 'Configuration Meta Lead Ads' WHERE "name" IS NULL;

-- Rendre la colonne NOT NULL
ALTER TABLE "google_ads_lead_config" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "google_sheet_sync_config" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "meta_lead_config" ALTER COLUMN "name" SET NOT NULL;

-- Changer l'ID pour utiliser cuid() au lieu d'une valeur fixe
-- Pour les tables existantes, on garde l'ID actuel mais on supprime la contrainte DEFAULT
ALTER TABLE "google_ads_lead_config" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "google_sheet_sync_config" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "meta_lead_config" ALTER COLUMN "id" DROP DEFAULT;
