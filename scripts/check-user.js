const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'jahzealibeh529@gmail.com' }
  });
  console.log('USER jahzealibeh529@gmail.com:', user);
}

check().catch(console.error).finally(() => prisma.$disconnect());
