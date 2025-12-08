-- Add isCompany and companyId fields to contact table
ALTER TABLE "contact" ADD COLUMN IF NOT EXISTS "isCompany" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contact" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Create index for companyId
CREATE INDEX IF NOT EXISTS "contact_companyId_idx" ON "contact"("companyId");

-- Create index for isCompany
CREATE INDEX IF NOT EXISTS "contact_isCompany_idx" ON "contact"("isCompany");

-- Add foreign key constraint for companyId
ALTER TABLE "contact" ADD CONSTRAINT "contact_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

