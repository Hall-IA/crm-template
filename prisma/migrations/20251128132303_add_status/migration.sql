-- CreateTable
CREATE TABLE "status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_name_key" ON "status"("name");

-- Insert default statuses (ignore if already exist)
INSERT INTO "status" ("id", "name", "color", "order", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, 'Nouveau', '#3B82F6', 1, NOW(), NOW()),
    (gen_random_uuid()::text, 'À rappeler', '#F59E0B', 2, NOW(), NOW()),
    (gen_random_uuid()::text, 'RDV pris', '#8B5CF6', 3, NOW(), NOW()),
    (gen_random_uuid()::text, 'Converti (contrat signé)', '#10B981', 4, NOW(), NOW()),
    (gen_random_uuid()::text, 'Perdu', '#EF4444', 5, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
