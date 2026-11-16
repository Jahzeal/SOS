const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, storeRole: true, businessId: true }
  });
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, plan: true, subscriptionStatus: true }
  });
  console.log('USERS:', JSON.stringify(users, null, 2));
  console.log('BUSINESSES:', JSON.stringify(businesses, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
