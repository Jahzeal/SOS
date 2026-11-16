const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testDelete() {
  const user = await prisma.user.findUnique({
    where: { email: 'menmail821@gmail.com' },
    include: { business: true }
  });

  if (!user) {
    console.log('User menmail821@gmail.com does not exist');
    return;
  }

  console.log('Found user:', user.email, 'Business:', user.businessId);

  // Test bcrypt compare with wrong password
  const wrongMatch = await bcrypt.compare('WrongPassword123!', user.password);
  console.log('Wrong password match:', wrongMatch); // false

  // Check quotes or records created by this user
  const quotesCount = await prisma.quote.count({ where: { createdById: user.id } });
  console.log('Quotes created by user:', quotesCount);
}

testDelete().catch(console.error).finally(() => prisma.$disconnect());
