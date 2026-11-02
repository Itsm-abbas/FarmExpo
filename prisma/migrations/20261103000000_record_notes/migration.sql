-- Notes typed on the records that post to ledgers, shown on statements.
-- Safe to run more than once (e.g. after `prisma db push`).
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "AirwayBill" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "CustomClearance" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Packing" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "RecoveryDone" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "consigneeNote" TEXT;

-- Existing purchases already have notes: bring them onto their ledger entries.
UPDATE "Transaction" AS t
SET "note" = NULLIF(p."notes", '')
FROM "Purchase" AS p
WHERE t."purchaseId" = p."id" AND t."source" = 'purchase' AND t."note" IS NULL;
