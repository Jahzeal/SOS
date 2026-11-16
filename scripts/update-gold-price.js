const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateGold() {
  // 25% off 120,000 is 90,000
  const updated = await prisma.subscriptionPlan.updateMany({
    where: {
      OR: [
        { code: 'GOLD101' },
        { code: 'GOLD' }
      ]
    },
    data: {
      annualPriceNgn: 90000
    }
  });

  console.log('Updated gold plans in db:', updated);

  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      OR: [
        { code: 'STARTER101' },
        { code: 'GOLD101' }
      ]
    },
    select: { code: true, name: true, monthlyPriceNgn: true, annualPriceNgn: true }
  });

  console.log('Current plans:', plans);
}

updateGold().catch(console.error).finally(() => prisma.$disconnect());
