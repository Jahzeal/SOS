const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'menmail821@gmail.com' },
    include: { business: true }
  });
  console.log('USER menmail821@gmail.com:', JSON.stringify(user, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
