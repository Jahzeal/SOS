const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('Starting database schema sync...');

  try {
    // 1. Create DeviceCategory enum if it doesn't exist
    console.log('1. Checking/creating DeviceCategory enum...');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeviceCategory') THEN
          CREATE TYPE "DeviceCategory" AS ENUM ('PHONE', 'LAPTOP');
          RAISE NOTICE 'DeviceCategory enum created.';
        ELSE
          RAISE NOTICE 'DeviceCategory enum already exists.';
        END IF;
      END $$;
    `);

    // 2. Add deviceCategory column to PhoneRecord table if it doesn't exist
    console.log('2. Checking/adding deviceCategory column to PhoneRecord...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PhoneRecord" 
      ADD COLUMN IF NOT EXISTS "deviceCategory" "DeviceCategory" NOT NULL DEFAULT 'PHONE';
    `);

    // 3. Create indexes on PhoneRecord for imei2 and serialNumber if missing
    console.log('3. Checking/creating PhoneRecord indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PhoneRecord_imei2_idx" ON "PhoneRecord"("imei2");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PhoneRecord_serialNumber_idx" ON "PhoneRecord"("serialNumber");
    `);

    // 4. Create ErrorLog table
    console.log('4. Checking/creating ErrorLog table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ErrorLog" (
        "id" TEXT NOT NULL,
        "endpoint" TEXT,
        "method" TEXT,
        "statusCode" INTEGER,
        "errorType" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "stack" TEXT,
        "businessId" TEXT,
        "userEmail" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
      );
    `);

    // 5. Create ErrorLog indexes
    console.log('5. Creating ErrorLog indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ErrorLog_errorType_idx" ON "ErrorLog"("errorType");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ErrorLog_statusCode_idx" ON "ErrorLog"("statusCode");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");
    `);

    // 6. Enable RLS on ErrorLog
    console.log('6. Enabling RLS on ErrorLog...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS public."ErrorLog" ENABLE ROW LEVEL SECURITY;
    `);

    console.log('Schema sync completed successfully!');

    // 7. Verify PhoneRecord and ErrorLog
    const countErrors = await prisma.errorLog.count();
    console.log('Verified: ErrorLog table exists and count is:', countErrors);

    const testPhone = await prisma.phoneRecord.findFirst({
      select: { id: true, deviceCategory: true }
    });
    console.log('Verified: PhoneRecord.deviceCategory query successful, sample:', testPhone);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
