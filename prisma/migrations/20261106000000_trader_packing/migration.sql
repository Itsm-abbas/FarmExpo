-- A trader / farmer can do the packing instead of a packer.
-- Safe to run more than once (e.g. after `prisma db push`).
ALTER TABLE "Packing" ALTER COLUMN "packerId" DROP NOT NULL;
ALTER TABLE "Packing" ADD COLUMN IF NOT EXISTS "traderId" INTEGER;
CREATE INDEX IF NOT EXISTS "Packing_traderId_idx" ON "Packing"("traderId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Packing_traderId_fkey') THEN
    ALTER TABLE "Packing" ADD CONSTRAINT "Packing_traderId_fkey"
      FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
