import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Migrating existing roles in DB to BUSINESS / ADMIN...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN role TYPE text;`);
    await prisma.$executeRawUnsafe(`UPDATE "User" SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN';`);
    await prisma.$executeRawUnsafe(`UPDATE "User" SET role = 'BUSINESS' WHERE role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'SALES_REP');`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "UserRole" CASCADE;`);
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUSINESS');`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole" USING (role::"UserRole");`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'BUSINESS'::"UserRole";`);
    console.log('✅ UserRole enum successfully migrated in PostgreSQL!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
