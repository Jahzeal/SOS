import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrPromoteAdmin() {
  const email = process.env.ADMIN_EMAIL || 'jahzealibeh529@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const firstName = 'Jahzeal';
  const lastName = 'Admin';
  const companyName = 'VerifyFlow Headquarters';
  const companySlug = 'verifyflow-hq';

  try {
    console.log(`\n========================================`);
    console.log(`🔑 Initializing Master Admin Account...`);
    console.log(`========================================\n`);

    // 1. Ensure the platform HQ business record exists
    let hqBusiness = await prisma.business.findUnique({
      where: { slug: companySlug },
    });

    if (!hqBusiness) {
      hqBusiness = await prisma.business.create({
        data: {
          name: companyName,
          slug: companySlug,
          email: 'hq@verifyflow.ng',
          phone: '+234 800 000 0000',
          publicVerificationEnabled: true,
        },
      });
      console.log(`🏢 Created HQ Business: ${hqBusiness.name} (ID: ${hqBusiness.id})`);
    }

    // 2. Check if the admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Promote existing user to ADMIN and update password
      const updated = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          firstName,
          lastName,
          businessId: hqBusiness.id,
        },
      });
      console.log(`✅ Existing user promoted to ADMIN: ${updated.email}`);
    } else {
      // Create fresh admin user
      const created = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.ADMIN,
          businessId: hqBusiness.id,
        },
      });
      console.log(`✅ Master Admin user created: ${created.email}`);
    }

    console.log(`\n----------------------------------------`);
    console.log(`📋 ADMIN LOGIN CREDENTIALS:`);
    console.log(`----------------------------------------`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log(`🌐 Role:     ADMIN (Full HQ Privileges)`);
    console.log(`🔗 Login at: http://localhost:3000/login`);
    console.log(`----------------------------------------\n`);
  } catch (err) {
    console.error('❌ Failed to create/promote admin user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createOrPromoteAdmin();
