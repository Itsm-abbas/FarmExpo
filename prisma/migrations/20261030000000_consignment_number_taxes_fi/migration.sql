-- Consignment numbers entered by the user, consignment taxes, the goods
-- declaration's currency, and financial instruments used per consignment.
-- Safe to run more than once (e.g. after `prisma db push`).

-- Consignment number: existing consignments keep their id as their number.
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "number" TEXT;
UPDATE "Consignment" SET "number" = "id"::text WHERE "number" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Consignment_organizationId_number_key" ON "Consignment"("organizationId", "number");

-- Taxes added to a consignment's costs: [{ "remark": ..., "amount": ... }].
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "taxes" JSONB;

-- FOB and freight are in the currency of the financial instrument used.
ALTER TABLE "GoodsDeclaration" ADD COLUMN IF NOT EXISTS "currency" TEXT;

-- Financial instrument utilizations belong to a consignment.
ALTER TABLE "FinancialInstrumentUtilization" ADD COLUMN IF NOT EXISTS "consignmentId" INTEGER;
ALTER TABLE "FinancialInstrumentUtilization" ALTER COLUMN "goodsDeclarationId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "FinancialInstrumentUtilization_consignmentId_idx" ON "FinancialInstrumentUtilization"("consignmentId");
-- Link existing utilizations to the consignment that uses their goods declaration.
UPDATE "FinancialInstrumentUtilization" AS u
SET "consignmentId" = c."id"
FROM "Consignment" AS c
WHERE u."consignmentId" IS NULL
  AND u."goodsDeclarationId" IS NOT NULL
  AND c."goodsDeclarationId" = u."goodsDeclarationId";
-- Give existing goods declarations the currency of their instruments.
UPDATE "GoodsDeclaration" AS g
SET "currency" = (
  SELECT fi."currency"
  FROM "FinancialInstrumentUtilization" AS u
  JOIN "FinancialInstrument" AS fi ON fi."id" = u."financialInstrumentId"
  WHERE u."goodsDeclarationId" = g."id" AND fi."currency" IS NOT NULL
  ORDER BY u."id"
  LIMIT 1
)
WHERE g."currency" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancialInstrumentUtilization_consignmentId_fkey') THEN
    ALTER TABLE "FinancialInstrumentUtilization" ADD CONSTRAINT "FinancialInstrumentUtilization_consignmentId_fkey"
      FOREIGN KEY ("consignmentId") REFERENCES "Consignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  -- The goods declaration link is now optional: drop it with the declaration.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancialInstrumentUtilization_goodsDeclarationId_fkey'
             AND confdeltype <> 'n') THEN
    ALTER TABLE "FinancialInstrumentUtilization" DROP CONSTRAINT "FinancialInstrumentUtilization_goodsDeclarationId_fkey";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FinancialInstrumentUtilization_goodsDeclarationId_fkey') THEN
    ALTER TABLE "FinancialInstrumentUtilization" ADD CONSTRAINT "FinancialInstrumentUtilization_goodsDeclarationId_fkey"
      FOREIGN KEY ("goodsDeclarationId") REFERENCES "GoodsDeclaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
