const fs = require('fs');
const path = require('path');

// Read env file
const envPath = path.resolve(__dirname, '../apps/backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        subscriptionPlan: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`TOTAL BUSINESSES FOUND: ${businesses.length}`);
    businesses.forEach((b, i) => {
      console.log(`--- [${i + 1}] Business: ${b.name} (${b.id}) ---`);
      console.log(`  Plan: ${b.plan}`);
      console.log(`  SubPlan Code: ${b.subscriptionPlan ? b.subscriptionPlan.code : 'None'}`);
      console.log(`  Subscription Status: ${b.subscriptionStatus}`);
      console.log(`  Trial Ends At: ${b.trialEndsAt ? b.trialEndsAt.toISOString() : 'NULL'}`);
      console.log(`  Subscription Ends At: ${b.subscriptionEndsAt ? b.subscriptionEndsAt.toISOString() : 'NULL'}`);
      console.log(`  Created At: ${b.createdAt ? b.createdAt.toISOString() : 'NULL'}`);
      console.log(`  Users: ${b.users.map(u => `${u.email} (${u.role})`).join(', ')}`);
    });

    const allPlans = await prisma.subscriptionPlan.findMany();
    console.log('\nALL SUBSCRIPTION PLANS IN DB:');
    allPlans.forEach(p => console.log(`  ${p.code}: ${p.name} (Price: ${p.monthlyPriceNgn})`));

    const allUsers = await prisma.user.findMany({
      include: {
        business: true
      }
    });
    console.log(`\nALL USERS (${allUsers.length}):`);
    allUsers.forEach(u => {
      console.log({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        businessId: u.businessId,
        businessName: u.business?.name,
        plan: u.business?.plan,
        subscriptionStatus: u.business?.subscriptionStatus,
        trialEndsAt: u.business?.trialEndsAt
      });
    });


    const standaloneUsers = allUsers.filter(u => !u.businessId);
    if (standaloneUsers.length > 0) {
      console.log('Standalone users (no business):', standaloneUsers);
    }
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
