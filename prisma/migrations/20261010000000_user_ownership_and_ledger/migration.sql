-- Per-user data ownership + server-side consignment ledger.
-- Written to be safe to run more than once (e.g. after `prisma db push`).

-- 1. Owner column on every top-level business table
ALTER TABLE "Trader"              ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Commodity"           ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Vendor"              ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Packaging"           ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "GoodsDeclaration"    ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Packing"             ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "RecoveryDone"        ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "AirwayBill"          ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "CustomClearance"     ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "FinancialInstrument" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Consignment"         ADD COLUMN IF NOT EXISTS "userId" INTEGER;

CREATE INDEX IF NOT EXISTS "Trader_userId_idx"              ON "Trader"("userId");
CREATE INDEX IF NOT EXISTS "Commodity_userId_idx"           ON "Commodity"("userId");
CREATE INDEX IF NOT EXISTS "Vendor_userId_idx"              ON "Vendor"("userId");
CREATE INDEX IF NOT EXISTS "Packaging_userId_idx"           ON "Packaging"("userId");
CREATE INDEX IF NOT EXISTS "GoodsDeclaration_userId_idx"    ON "GoodsDeclaration"("userId");
CREATE INDEX IF NOT EXISTS "Packing_userId_idx"             ON "Packing"("userId");
CREATE INDEX IF NOT EXISTS "RecoveryDone_userId_idx"        ON "RecoveryDone"("userId");
CREATE INDEX IF NOT EXISTS "AirwayBill_userId_idx"          ON "AirwayBill"("userId");
CREATE INDEX IF NOT EXISTS "CustomClearance_userId_idx"     ON "CustomClearance"("userId");
CREATE INDEX IF NOT EXISTS "FinancialInstrument_userId_idx" ON "FinancialInstrument"("userId");
CREATE INDEX IF NOT EXISTS "Consignment_userId_idx"         ON "Consignment"("userId");

-- 2. Ledger columns
ALTER TABLE "Vendor"      ADD COLUMN IF NOT EXISTS "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "consigneeAmount" DOUBLE PRECISION;

-- 3. Existing records were shared by everyone and have no recorded creator,
--    so they are given to the first admin (or the first user if there is no admin).
DO $$
DECLARE owner_id INTEGER;
BEGIN
  SELECT "id" INTO owner_id FROM "User" ORDER BY ("role" = 'admin') DESC, "id" ASC LIMIT 1;
  IF owner_id IS NOT NULL THEN
    UPDATE "Trader"              SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "Commodity"           SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "Vendor"              SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "Packaging"           SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "GoodsDeclaration"    SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "Packing"             SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "RecoveryDone"        SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "AirwayBill"          SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "CustomClearance"     SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "FinancialInstrument" SET "userId" = owner_id WHERE "userId" IS NULL;
    UPDATE "Consignment"         SET "userId" = owner_id WHERE "userId" IS NULL;
  END IF;
END $$;

-- 4. Tag the entries the old forms posted from consignments, so the server
--    now owns (updates/moves/removes) them instead of creating duplicates.
UPDATE "Transaction" SET "source" = 'airwayBill'
  WHERE "source" IS NULL AND "consignmentId" IS NOT NULL
    AND "details" LIKE 'Airway bill fee for consignment%';
UPDATE "Transaction" SET "source" = 'customClearance'
  WHERE "source" IS NULL AND "consignmentId" IS NOT NULL
    AND "details" LIKE 'Custom clearance fee for consignment%';
UPDATE "Transaction" SET "source" = 'consignee'
  WHERE "source" IS NULL AND "consignmentId" IS NOT NULL
    AND ("details" LIKE 'Initial balance for consignment%'
      OR "details" LIKE 'Balance updated for consignment%');

-- 5. The consignee amount used to live only in the ledger entry; copy it
--    onto the consignment it belongs to.
UPDATE "Consignment" AS c SET "consigneeAmount" = t."amount"
FROM (
  SELECT DISTINCT ON ("consignmentId") "consignmentId", "amount"
  FROM "Transaction"
  WHERE "source" = 'consignee'
  ORDER BY "consignmentId", "createdAt" DESC, "id" DESC
) AS t
WHERE t."consignmentId" = c."id" AND c."consigneeAmount" IS NULL;

-- 6. Opening balances.
--    Default: current balance minus everything posted, so balances don't move.
UPDATE "Vendor" AS v SET "openingBalance" = COALESCE(v."balance", 0) - COALESCE((
  SELECT SUM(CASE WHEN t."type" = 'debit' THEN -t."amount" ELSE t."amount" END)
  FROM "Transaction" t WHERE t."vendorId" = v."id"
), 0);

--    Consignees: the old consignee form overwrote the vendor balance with the
--    consignment amount, so rebuild their opening balance from the balance
--    recorded just before their first ledger entry.
UPDATE "Vendor" AS v
SET "openingBalance" = f."balanceAfter"
  - CASE WHEN f."type" = 'debit' THEN -f."amount" ELSE f."amount" END
FROM (
  SELECT DISTINCT ON ("vendorId") "vendorId", "balanceAfter", "type", "amount"
  FROM "Transaction"
  ORDER BY "vendorId", "createdAt" ASC, "id" ASC
) AS f
WHERE f."vendorId" = v."id"
  AND EXISTS (SELECT 1 FROM "Consignee" c WHERE c."vendorId" = v."id");

-- 7. Recompute every running balance (balanceAfter) and vendor balance.
UPDATE "Transaction" AS t SET "balanceAfter" = r.running
FROM (
  SELECT t2."id",
    ROUND((v."openingBalance" + SUM(
      CASE WHEN t2."type" = 'debit' THEN -t2."amount" ELSE t2."amount" END
    ) OVER (PARTITION BY t2."vendorId" ORDER BY t2."createdAt", t2."id"))::numeric, 2)::double precision AS running
  FROM "Transaction" t2
  JOIN "Vendor" v ON v."id" = t2."vendorId"
) AS r
WHERE t."id" = r."id";

UPDATE "Vendor" AS v SET "balance" = ROUND((v."openingBalance" + COALESCE((
  SELECT SUM(CASE WHEN t."type" = 'debit' THEN -t."amount" ELSE t."amount" END)
  FROM "Transaction" t WHERE t."vendorId" = v."id"
), 0))::numeric, 2)::double precision;
