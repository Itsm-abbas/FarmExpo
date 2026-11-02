-- Expense heads (office, house, ...): ledger accounts that money is spent on
-- rather than parties we deal with.
-- Safe to run more than once (e.g. after `prisma db push`).
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "isExpense" BOOLEAN NOT NULL DEFAULT false;
