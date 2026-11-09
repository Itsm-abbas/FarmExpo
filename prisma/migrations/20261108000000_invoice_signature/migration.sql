-- A signature image printed on invoices above "Authorised signature".
-- Safe to run more than once (e.g. after `prisma db push`).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "signatureOn" TEXT NOT NULL DEFAULT 'commercial';
