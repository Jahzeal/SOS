import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function clearDatabase() {
  const adminEmail = process.env.ADMIN_EMAIL || 'jahzealibeh529@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  console.log(`\n========================================`);
  console.log(`🧹 Clearing Database to Pure Clean State...`);
  console.log(`========================================\n`);

  try {
    // 1. Delete all transactional, customer, and verification logs
    console.log('1. Purging verification logs & telemetry...');
    await prisma.verificationLog.deleteMany({});

    console.log('2. Purging sale items & sales transactions...');
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});

    console.log('3. Purging repair tickets...');
    await prisma.repairTicket.deleteMany({});

    console.log('4. Purging inventory phone records...');
    await prisma.phoneRecord.deleteMany({});

    console.log('5. Purging customer records...');
    await prisma.customer.deleteMany({});

    console.log('6. Purging support tickets & notifications...');
    await prisma.supportTicket.deleteMany({});
    await prisma.adminNotification.deleteMany({});

    console.log('7. Purging refresh tokens...');
    await prisma.refreshToken.deleteMany({});

    // 2. Disassociate Master Admin from any business before deleting businesses
    console.log('8. Ensuring Master Admin is decoupled from any business...');
    await prisma.user.updateMany({
      where: { role: UserRole.ADMIN },
      data: { businessId: null },
    });

    // 3. Delete all non-admin users
    console.log('9. Deleting all non-admin merchant users...');
    await prisma.user.deleteMany({
      where: {
        role: { not: UserRole.ADMIN },
      },
    });

    // 4. Delete all merchant businesses
    console.log('10. Deleting all merchant store records...');
    await prisma.business.deleteMany({});

    // 5. Ensure Master Admin exists and is pure
    console.log('11. Ensuring Master Admin account is pristine...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          firstName: 'Jahzeal',
          lastName: 'Admin',
          businessId: null,
        },
      });
      console.log(`✅ Master Admin verified: ${adminEmail}`);
    } else {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Jahzeal',
          lastName: 'Admin',
          role: UserRole.ADMIN,
          businessId: null,
        },
      });
      console.log(`✅ Master Admin created: ${adminEmail}`);
    }

    const businessCount = await prisma.business.count();
    const userCount = await prisma.user.count();
    const phoneCount = await prisma.phoneRecord.count();
    const salesCount = await prisma.sale.count();

    console.log(`\n----------------------------------------`);
    console.log(`🎉 DATABASE PURGE COMPLETE:`);
    console.log(`----------------------------------------`);
    console.log(`🏪 Stores:             ${businessCount}`);
    console.log(`👥 Users:              ${userCount} (Master Admin only)`);
    console.log(`📱 Phones/Inventory:   ${phoneCount}`);
    console.log(`🧾 Sales/Transactions: ${salesCount}`);
    console.log(`📧 Master Admin:       ${adminEmail}`);
    console.log(`🔒 Master Password:    ${adminPassword}`);
    console.log(`----------------------------------------\n`);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
