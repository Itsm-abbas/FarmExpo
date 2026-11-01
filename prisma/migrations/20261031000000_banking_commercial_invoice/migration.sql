-- Bank accounts (entered by hand), the bank account a ledger entry went
-- through, and the commercial invoice's currency and selling rates.
-- Safe to run more than once (e.g. after `prisma db push`).

CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "organizationId" INTEGER,
    "bankName" TEXT NOT NULL,
    "accountTitle" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "iban" TEXT,
    "branch" TEXT,
    "swift" TEXT,
    "currency" TEXT NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BankAccount_organizationId_idx" ON "BankAccount"("organizationId");

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bankAccountId" INTEGER;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bankType" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bankAmount" DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "Transaction_bankAccountId_idx" ON "Transaction"("bankAccountId");

ALTER TABLE "Consignment" ADD COLUMN IF NOT EXISTS "commercialCurrency" TEXT;
ALTER TABLE "ConsignmentItem" ADD COLUMN IF NOT EXISTS "saleRate" DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankAccount_organizationId_fkey') THEN
    ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_bankAccountId_fkey') THEN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bankAccountId_fkey"
      FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
