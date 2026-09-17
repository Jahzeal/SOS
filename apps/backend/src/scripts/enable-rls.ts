import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Starting Supabase Row-Level Security (RLS) hardening...');

  // 1. Fetch all user tables in the public schema
  const tables: Array<{ tablename: string }> = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE '_prisma%'
    ORDER BY tablename ASC;
  `;

  if (tables.length === 0) {
    console.log('⚠️ No public tables found in the database.');
    return;
  }

  console.log(`Found ${tables.length} tables in the public schema:`);
  tables.forEach((t) => console.log(` - ${t.tablename}`));

  // 2. Enable RLS on each table
  for (const table of tables) {
    const tableName = table.tablename;
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ Enabled RLS on: public."${tableName}"`);
    } catch (err: any) {
      console.error(`❌ Failed to enable RLS on: public."${tableName}" - ${err.message}`);
    }
  }

  // 3. Verification: Query pg_class to confirm relrowsecurity status
  console.log('\n🔍 Verifying Row-Level Security status on all tables...');
  const verification: Array<{ table_name: string; rls_enabled: boolean }> = await prisma.$queryRaw`
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE '_prisma%'
    ORDER BY c.relname ASC;
  `;

  console.table(verification);

  const allSecure = verification.every((v) => v.rls_enabled);
  if (allSecure) {
    console.log('\n🎉 ALL TABLES ARE FULLY SECURED WITH ROW-LEVEL SECURITY!');
    console.log('External queries via Supabase PostgREST API without valid JWT policies are now blocked.');
  } else {
    console.warn('\n⚠️ Some tables still have RLS disabled.');
  }
}

main()
  .catch((e) => {
    console.error('Error applying RLS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
