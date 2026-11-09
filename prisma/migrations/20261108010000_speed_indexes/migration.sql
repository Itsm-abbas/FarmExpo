-- Indexes for the slowest lookups: a consignment's items (loaded with every
-- consignment and invoice) and a ledger's entries in date order.
-- Safe to run more than once.
CREATE INDEX IF NOT EXISTS "ConsignmentItem_consignmentId_idx" ON "ConsignmentItem"("consignmentId");
CREATE INDEX IF NOT EXISTS "Transaction_vendorId_createdAt_idx" ON "Transaction"("vendorId", "createdAt");
DROP INDEX IF EXISTS "Transaction_vendorId_idx";
