-- Invoice templates, letterhead and invoice notes per organization.
-- Safe to run more than once (e.g. after `prisma db push`).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "invoiceTemplate" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "letterhead" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "useLetterhead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "letterheadTop" INTEGER NOT NULL DEFAULT 45;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "letterheadBottom" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "invoiceNotes" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "letterheadType" TEXT;
