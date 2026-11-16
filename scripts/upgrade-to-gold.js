const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upgrade() {
  const user = await prisma.user.findUnique({
    where: { email: 'jahzealibeh16@gmail.com' },
    include: { business: true }
  });

  if (!user || !user.businessId) {
    console.log('User or business not found for jahzealibeh16@gmail.com');
    return;
  }

  // Find the GOLD plan
  const goldPlan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { code: 'GOLD101' },
        { code: 'GOLD' },
        { name: { contains: 'Gold', mode: 'insensitive' } }
      ]
    }
  });

  console.log('Found gold plan:', goldPlan);

  const planCode = goldPlan ? goldPlan.code : 'GOLD101';
  const planId = goldPlan ? goldPlan.id : null;

  // Set active for 1 year from now
  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  const updatedBiz = await prisma.business.update({
    where: { id: user.businessId },
    data: {
      plan: planCode,
      planId: planId,
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt: endsAt,
    }
  });

  console.log('Updated business:', updatedBiz);
}

upgrade().catch(console.error).finally(() => prisma.$disconnect());
