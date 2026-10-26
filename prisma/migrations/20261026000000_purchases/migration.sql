-- Purchases from traders/farmers, their ledger accounts, and the link from
-- ledger entries to the purchase that posted them.
-- Safe to run more than once (e.g. after `prisma db push`).

-- A trader's ledger account (created with their first purchase).
ALTER TABLE "Trader" ADD COLUMN IF NOT EXISTS "vendorId" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "Trader_vendorId_key" ON "Trader"("vendorId");

CREATE TABLE IF NOT EXISTS "Purchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "organizationId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "traderId" INTEGER NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Purchase_organizationId_date_idx" ON "Purchase"("organizationId", "date");
CREATE INDEX IF NOT EXISTS "Purchase_userId_idx" ON "Purchase"("userId");
CREATE INDEX IF NOT EXISTS "Purchase_traderId_idx" ON "Purchase"("traderId");
CREATE INDEX IF NOT EXISTS "Purchase_commodityId_idx" ON "Purchase"("commodityId");

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "purchaseId" INTEGER;
CREATE INDEX IF NOT EXISTS "Transaction_purchaseId_idx" ON "Transaction"("purchaseId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Trader_vendorId_fkey') THEN
    ALTER TABLE "Trader" ADD CONSTRAINT "Trader_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_traderId_fkey') THEN
    ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_traderId_fkey"
      FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Purchase_commodityId_fkey') THEN
    ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_commodityId_fkey"
      FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_purchaseId_fkey') THEN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_purchaseId_fkey"
      FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
