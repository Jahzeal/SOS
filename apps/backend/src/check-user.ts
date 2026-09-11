import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkUserAndBusiness(emailQuery: string) {
  const cleanEmail = emailQuery.trim().toLowerCase();
  console.log(`\n Searching database for: "${cleanEmail}"...\n`);

  // 1. Search User table
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { business: true },
  });

  // 2. Search Business table by email
  const businessByEmail = await prisma.business.findFirst({
    where: { email: cleanEmail },
    include: { users: true },
  });

  // 3. Search Customers
  const customer = await prisma.customer.findFirst({
    where: { email: cleanEmail },
    include: { business: true },
  });

  if (user) {
    console.log(` USER FOUND:`);
    console.log(`   User ID:     ${user.id}`);
    console.log(`   Name:        ${user.firstName} ${user.lastName || ''}`);
    console.log(`   Email:       ${user.email}`);
    console.log(`   Role:        ${user.role}`);
    console.log(`   Business ID: ${user.businessId || 'None (Global Master Admin)'}`);
    if (user.business) {
      console.log(`    Store Name:   ${user.business.name}`);
      console.log(`    Store Slug:   ${user.business.slug}`);
      console.log(`    Store Plan:   ${user.business.plan} (${user.business.subscriptionStatus})`);
      console.log(`    Created At:   ${user.business.createdAt.toISOString()}`);
    }
  } else {
    console.log(` No User account found with email: ${cleanEmail}`);
  }

  if (businessByEmail && (!user || user.businessId !== businessByEmail.id)) {
    console.log(`\n BUSINESS FOUND (Direct email match):`);
    console.log(`   Store Name: ${businessByEmail.name}`);
    console.log(`   Store ID:   ${businessByEmail.id}`);
    console.log(`   Store Slug: ${businessByEmail.slug}`);
  }

  if (customer) {
    console.log(`\n CUSTOMER RECORD FOUND:`);
    console.log(`   Name:     ${customer.name}`);
    console.log(`   Phone:    ${customer.phone}`);
    console.log(`   Store ID: ${customer.businessId}`);
  }

  console.log(`\n----------------------------------------\n`);
}

checkUserAndBusiness('jahzealibeh3@gmail.com')
  .catch((e) => console.error('Query error:', e))
  .finally(() => prisma.$disconnect());
