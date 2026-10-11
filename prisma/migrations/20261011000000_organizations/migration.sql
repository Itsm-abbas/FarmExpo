-- Organizations: an admin and the users they add share one organization's data.
-- Written to be safe to run more than once (e.g. after `prisma db push`).

-- 1. Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "ntn" TEXT,
    "website" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'PKR',
    "brandColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- 2. Users: organization membership and password reset
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_organizationId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Organization on every top-level business table
ALTER TABLE "Trader"              ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Commodity"           ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Vendor"              ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Packaging"           ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "GoodsDeclaration"    ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Packing"             ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "RecoveryDone"        ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "AirwayBill"          ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "CustomClearance"     ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "FinancialInstrument" ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;
ALTER TABLE "Consignment"         ADD COLUMN IF NOT EXISTS "organizationId" INTEGER;

CREATE INDEX IF NOT EXISTS "Trader_organizationId_idx"              ON "Trader"("organizationId");
CREATE INDEX IF NOT EXISTS "Commodity_organizationId_idx"           ON "Commodity"("organizationId");
CREATE INDEX IF NOT EXISTS "Vendor_organizationId_idx"              ON "Vendor"("organizationId");
CREATE INDEX IF NOT EXISTS "Packaging_organizationId_idx"           ON "Packaging"("organizationId");
CREATE INDEX IF NOT EXISTS "GoodsDeclaration_organizationId_idx"    ON "GoodsDeclaration"("organizationId");
CREATE INDEX IF NOT EXISTS "Packing_organizationId_idx"             ON "Packing"("organizationId");
CREATE INDEX IF NOT EXISTS "RecoveryDone_organizationId_idx"        ON "RecoveryDone"("organizationId");
CREATE INDEX IF NOT EXISTS "AirwayBill_organizationId_idx"          ON "AirwayBill"("organizationId");
CREATE INDEX IF NOT EXISTS "CustomClearance_organizationId_idx"     ON "CustomClearance"("organizationId");
CREATE INDEX IF NOT EXISTS "FinancialInstrument_organizationId_idx" ON "FinancialInstrument"("organizationId");
CREATE INDEX IF NOT EXISTS "Consignment_organizationId_idx"         ON "Consignment"("organizationId");

-- 4. Every user nobody created (a self sign-up) gets an organization; users
--    added by an admin join their creator's organization. The oldest one is
--    the existing FarmExpo account.
DO $$
DECLARE
  r RECORD;
  new_org INTEGER;
  first_org BOOLEAN := NOT EXISTS (SELECT 1 FROM "Organization");
BEGIN
  FOR r IN
    SELECT "id", "name", "email" FROM "User"
    WHERE "organizationId" IS NULL AND "createdById" IS NULL
    ORDER BY ("role" = 'admin') DESC, "id"
  LOOP
    INSERT INTO "Organization" ("name", "updatedAt")
    VALUES (
      CASE WHEN first_org THEN 'FarmExpo'
           ELSE COALESCE(NULLIF(r."name", ''), split_part(r."email", '@', 1)) || '''s organization'
      END,
      CURRENT_TIMESTAMP
    )
    RETURNING "id" INTO new_org;
    first_org := FALSE;
    UPDATE "User" SET "organizationId" = new_org WHERE "id" = r."id";
  END LOOP;

  -- Added users inherit their creator's organization, down the whole chain.
  LOOP
    UPDATE "User" AS u SET "organizationId" = c."organizationId"
    FROM "User" AS c
    WHERE u."createdById" = c."id"
      AND u."organizationId" IS NULL
      AND c."organizationId" IS NOT NULL;
    EXIT WHEN NOT FOUND;
  END LOOP;

  -- Anyone still without one (broken creator chain) gets their own.
  FOR r IN SELECT "id", "name", "email" FROM "User" WHERE "organizationId" IS NULL LOOP
    INSERT INTO "Organization" ("name", "updatedAt")
    VALUES (COALESCE(NULLIF(r."name", ''), split_part(r."email", '@', 1)) || '''s organization', CURRENT_TIMESTAMP)
    RETURNING "id" INTO new_org;
    UPDATE "User" SET "organizationId" = new_org WHERE "id" = r."id";
  END LOOP;
END $$;

-- 5. Records belong to the organization of the user who created them;
--    records without a (still existing) creator go to the first organization.
DO $$
DECLARE
  t TEXT;
  fallback INTEGER := (SELECT MIN("id") FROM "Organization");
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Trader', 'Commodity', 'Vendor', 'Packaging', 'GoodsDeclaration', 'Packing',
    'RecoveryDone', 'AirwayBill', 'CustomClearance', 'FinancialInstrument', 'Consignment'
  ]
  LOOP
    EXECUTE format(
      'UPDATE %I AS r SET "organizationId" = u."organizationId"
         FROM "User" AS u
        WHERE r."userId" = u."id" AND r."organizationId" IS NULL', t);
    IF fallback IS NOT NULL THEN
      EXECUTE format(
        'UPDATE %I SET "organizationId" = $1 WHERE "organizationId" IS NULL', t)
      USING fallback;
    END IF;
  END LOOP;
END $$;
