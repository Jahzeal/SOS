import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    include: {
      users: {
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      },
      _count: {
        select: { phoneRecords: true, sales: true, customers: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n========================================`);
  console.log(` FOUND ${businesses.length} BUSINESS(ES) IN DATABASE`);
  console.log(`========================================\n`);

  businesses.forEach((b, idx) => {
    console.log(`[${idx + 1}] ID: ${b.id}`);
    console.log(`    Name:       ${b.name}`);
    console.log(`    Slug:       ${b.slug}`);
    console.log(`    Plan:       ${b.plan} (Status: ${b.subscriptionStatus})`);
    console.log(`    Created At: ${b.createdAt.toISOString()}`);
    console.log(`    Users (${b.users.length}):`);
    b.users.forEach((u) => {
      console.log(`      • ${u.firstName} ${u.lastName || ''} (${u.email}) - Role: ${u.role}`);
    });
    console.log(`    Counts: ${b._count.phoneRecords} phones, ${b._count.sales} sales, ${b._count.customers} customers\n`);
  });
}

main()
  .catch((e) => console.error('Database query failed:', e))
  .finally(() => prisma.$disconnect());
