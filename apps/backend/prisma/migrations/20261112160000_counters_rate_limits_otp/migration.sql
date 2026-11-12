-- Receipt numbers become unique per store instead of globally.
DROP INDEX IF EXISTS "Sale_receiptNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_businessId_receiptNumber_key" ON "Sale"("businessId", "receiptNumber");
CREATE INDEX IF NOT EXISTS "Sale_businessId_createdAt_idx" ON "Sale"("businessId", "createdAt");

-- Per-store running document numbers.
CREATE TABLE IF NOT EXISTS "DocumentCounter" (
    "businessId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("businessId", "kind")
);

-- Request rate limiting.
CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "RateLimitBucket_windowEndsAt_idx" ON "RateLimitBucket"("windowEndsAt");

-- Pending email verification codes.
CREATE TABLE IF NOT EXISTS "EmailOtp" (
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOtp_pkey" PRIMARY KEY ("email")
);

-- Keep the Supabase REST API locked out of the new tables.
ALTER TABLE "DocumentCounter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailOtp" ENABLE ROW LEVEL SECURITY;
