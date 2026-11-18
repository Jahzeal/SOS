-- CreateEnum
CREATE TYPE "DeviceSource" AS ENUM ('PURCHASE', 'TRADE_IN');

-- CreateEnum
CREATE TYPE "TradeInKind" AS ENUM ('SWAP', 'BUY');

-- CreateEnum
CREATE TYPE "TradeInStatus" AS ENUM ('COMPLETED', 'BLOCKED');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "dailySummaryEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dailySummaryHour" INTEGER NOT NULL DEFAULT 21,
ADD COLUMN     "lastDailySummaryOn" TEXT;

-- AlterTable
ALTER TABLE "PhoneRecord" ADD COLUMN     "source" "DeviceSource" NOT NULL DEFAULT 'PURCHASE';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "tradeInCredit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TradeIn" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "kind" "TradeInKind" NOT NULL,
    "status" "TradeInStatus" NOT NULL DEFAULT 'COMPLETED',
    "saleId" TEXT,
    "phoneRecordId" TEXT,
    "customerId" TEXT,
    "deviceCategory" "DeviceCategory" NOT NULL DEFAULT 'PHONE',
    "imei1" TEXT,
    "imei2" TEXT,
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "condition" "PhoneCondition",
    "customerName" TEXT,
    "customerPhone" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "ownershipConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "tradeInValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "blockedReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradeIn_saleId_key" ON "TradeIn"("saleId");

-- CreateIndex
CREATE INDEX "TradeIn_businessId_createdAt_idx" ON "TradeIn"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "TradeIn_branchId_idx" ON "TradeIn"("branchId");

-- CreateIndex
CREATE INDEX "TradeIn_phoneRecordId_idx" ON "TradeIn"("phoneRecordId");

-- CreateIndex
CREATE INDEX "TradeIn_imei1_idx" ON "TradeIn"("imei1");

-- CreateIndex
CREATE INDEX "TradeIn_serialNumber_idx" ON "TradeIn"("serialNumber");

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_phoneRecordId_fkey" FOREIGN KEY ("phoneRecordId") REFERENCES "PhoneRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

