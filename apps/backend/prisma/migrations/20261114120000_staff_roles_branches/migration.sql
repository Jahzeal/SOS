-- Staff accounts, store roles, branches and per-plan staff/branch limits.
-- Safe for existing stores: every current account becomes the OWNER of its store,
-- every store gets a "Main branch", and all existing records are placed in it.

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'MANAGER', 'SALES', 'TECHNICIAN');

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "maxBranches" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxStaff" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "storeRole" "StoreRole" NOT NULL DEFAULT 'OWNER';

-- AlterTable
ALTER TABLE "PhoneRecord" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "RepairTicket" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "branchId" TEXT;

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "storeRole" "StoreRole" NOT NULL,
    "branchId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_businessId_idx" ON "Branch"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_businessId_name_key" ON "Branch"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffInvite_businessId_idx" ON "StaffInvite"("businessId");

-- CreateIndex
CREATE INDEX "StaffInvite_email_idx" ON "StaffInvite"("email");

-- CreateIndex
CREATE INDEX "PhoneRecord_branchId_idx" ON "PhoneRecord"("branchId");

-- CreateIndex
CREATE INDEX "RepairTicket_branchId_idx" ON "RepairTicket"("branchId");

-- CreateIndex
CREATE INDEX "Sale_branchId_idx" ON "Sale"("branchId");

-- CreateIndex
CREATE INDEX "Quote_branchId_idx" ON "Quote"("branchId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneRecord" ADD CONSTRAINT "PhoneRecord_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Data: one main branch per existing store, and existing records placed in it.
-- ---------------------------------------------------------------------------
INSERT INTO "Branch" ("id", "businessId", "name", "isMain", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, b."id", 'Main branch', true, true, NOW(), NOW()
FROM "Business" b
WHERE NOT EXISTS (SELECT 1 FROM "Branch" x WHERE x."businessId" = b."id" AND x."isMain" = true);

UPDATE "PhoneRecord" r SET "branchId" = br."id"
FROM "Branch" br WHERE br."businessId" = r."businessId" AND br."isMain" = true AND r."branchId" IS NULL;

UPDATE "Sale" r SET "branchId" = br."id"
FROM "Branch" br WHERE br."businessId" = r."businessId" AND br."isMain" = true AND r."branchId" IS NULL;

UPDATE "RepairTicket" r SET "branchId" = br."id"
FROM "Branch" br WHERE br."businessId" = r."businessId" AND br."isMain" = true AND r."branchId" IS NULL;

UPDATE "Quote" r SET "branchId" = br."id"
FROM "Branch" br WHERE br."businessId" = r."businessId" AND br."isMain" = true AND r."branchId" IS NULL;

-- ---------------------------------------------------------------------------
-- Data: staff and branch limits per plan (0 = unlimited). Editable later in Admin → Plans.
-- ---------------------------------------------------------------------------
UPDATE "SubscriptionPlan" SET "maxStaff" = 1,  "maxBranches" = 1 WHERE UPPER("code") = 'FREE';
UPDATE "SubscriptionPlan" SET "maxStaff" = 3,  "maxBranches" = 1 WHERE UPPER("code") = 'STARTER';
UPDATE "SubscriptionPlan" SET "maxStaff" = 10, "maxBranches" = 2 WHERE UPPER("code") IN ('GOLD', 'BUSINESS');
UPDATE "SubscriptionPlan" SET "maxStaff" = 0,  "maxBranches" = 0 WHERE UPPER("code") = 'ENTERPRISE';

-- New tables are closed to Supabase's public API, like every other table (see enable_rls.sql).
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffInvite" ENABLE ROW LEVEL SECURITY;
