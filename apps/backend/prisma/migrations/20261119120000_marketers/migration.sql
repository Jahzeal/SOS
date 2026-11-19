-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "isMarketerStore" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Marketer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "tokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "businessId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marketer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketerReferral" (
    "id" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "shopName" TEXT,
    "phone" TEXT,
    "businessId" TEXT,
    "alreadyCustomer" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marketer_email_key" ON "Marketer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Marketer_tokenHash_key" ON "Marketer"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Marketer_businessId_key" ON "Marketer"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerReferral_email_key" ON "MarketerReferral"("email");

-- CreateIndex
CREATE INDEX "MarketerReferral_marketerId_idx" ON "MarketerReferral"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerReferral_businessId_idx" ON "MarketerReferral"("businessId");

-- AddForeignKey
ALTER TABLE "Marketer" ADD CONSTRAINT "Marketer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerReferral" ADD CONSTRAINT "MarketerReferral_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "Marketer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerReferral" ADD CONSTRAINT "MarketerReferral_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

