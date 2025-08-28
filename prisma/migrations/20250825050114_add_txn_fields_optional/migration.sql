/*
  Warnings:

  - Made the column `address` on table `Trader` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Trader` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Trader_ntn_key";

-- AlterTable
ALTER TABLE "Trader" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "details" TEXT,
    "createdBy" INTEGER,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Packaging" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "packagingWeightPerUnit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Packaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsDeclaration" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "commercialInvoiceNumber" TEXT NOT NULL,
    "fob" DOUBLE PRECISION NOT NULL,
    "gdFreight" DOUBLE PRECISION NOT NULL,
    "r1" DOUBLE PRECISION NOT NULL,
    "dateR1" TIMESTAMP(3) NOT NULL,
    "r2" DOUBLE PRECISION NOT NULL,
    "dateR2" TIMESTAMP(3) NOT NULL,
    "r3" DOUBLE PRECISION NOT NULL,
    "dateR3" TIMESTAMP(3) NOT NULL,
    "r4" DOUBLE PRECISION NOT NULL,
    "dateR4" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Packing" (
    "id" SERIAL NOT NULL,
    "packerId" INTEGER NOT NULL,
    "ratePerKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Packing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryDone" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryDone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirwayBill" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "iataAgentId" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "airwayBillWeight" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirwayBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomClearance" (
    "id" SERIAL NOT NULL,
    "customAgentId" INTEGER NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialInstrument" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "traderId" INTEGER,
    "bankName" TEXT,
    "mode" TEXT,
    "consigneeId" INTEGER,
    "deliveryTerm" TEXT,
    "currency" TEXT,
    "localDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iban" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialInstrumentUtilization" (
    "id" SERIAL NOT NULL,
    "financialInstrumentId" INTEGER NOT NULL,
    "goodsDeclarationId" INTEGER NOT NULL,
    "utilized" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialInstrumentUtilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentItem" (
    "id" SERIAL NOT NULL,
    "consignmentId" INTEGER NOT NULL,
    "commodityItemId" INTEGER NOT NULL,
    "packagingId" INTEGER NOT NULL,
    "weightPerUnit" DOUBLE PRECISION NOT NULL,
    "commodityPerUnitCost" DOUBLE PRECISION NOT NULL,
    "packagingPerUnitCost" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "damage" INTEGER NOT NULL,

    CONSTRAINT "ConsignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consignment" (
    "id" SERIAL NOT NULL,
    "traderId" INTEGER,
    "consigneeId" INTEGER,
    "airwayBillId" INTEGER,
    "goodsDeclarationId" INTEGER,
    "customClearanceId" INTEGER,
    "packingId" INTEGER,
    "recoveryDoneId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "localInvoiceWeight" DOUBLE PRECISION,
    "dailyExpenses" DOUBLE PRECISION,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_vendorId_idx" ON "Transaction"("vendorId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Packing" ADD CONSTRAINT "Packing_packerId_fkey" FOREIGN KEY ("packerId") REFERENCES "Packer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirwayBill" ADD CONSTRAINT "AirwayBill_iataAgentId_fkey" FOREIGN KEY ("iataAgentId") REFERENCES "IATAAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomClearance" ADD CONSTRAINT "CustomClearance_customAgentId_fkey" FOREIGN KEY ("customAgentId") REFERENCES "CustomAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialInstrument" ADD CONSTRAINT "FinancialInstrument_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialInstrument" ADD CONSTRAINT "FinancialInstrument_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialInstrumentUtilization" ADD CONSTRAINT "FinancialInstrumentUtilization_financialInstrumentId_fkey" FOREIGN KEY ("financialInstrumentId") REFERENCES "FinancialInstrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialInstrumentUtilization" ADD CONSTRAINT "FinancialInstrumentUtilization_goodsDeclarationId_fkey" FOREIGN KEY ("goodsDeclarationId") REFERENCES "GoodsDeclaration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "Consignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_commodityItemId_fkey" FOREIGN KEY ("commodityItemId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "Packaging"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_airwayBillId_fkey" FOREIGN KEY ("airwayBillId") REFERENCES "AirwayBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_goodsDeclarationId_fkey" FOREIGN KEY ("goodsDeclarationId") REFERENCES "GoodsDeclaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_customClearanceId_fkey" FOREIGN KEY ("customClearanceId") REFERENCES "CustomClearance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_packingId_fkey" FOREIGN KEY ("packingId") REFERENCES "Packing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignment" ADD CONSTRAINT "Consignment_recoveryDoneId_fkey" FOREIGN KEY ("recoveryDoneId") REFERENCES "RecoveryDone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
