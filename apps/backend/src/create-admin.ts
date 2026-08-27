import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrPromoteAdmin() {
  const email = process.env.ADMIN_EMAIL || 'jahzealibeh529@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const firstName = 'Jahzeal';
  const lastName = 'Admin';

  try {
    console.log(`\n========================================`);
    console.log(`🔑 Initializing Pure Master Admin Account...`);
    console.log(`========================================\n`);

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Check if the admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Promote existing user to global ADMIN with no store association
      const updated = await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
          firstName,
          lastName,
          businessId: null,
        },
      });
      console.log(`✅ Master Admin updated: ${updated.email} (Pure Global Admin)`);
    } else {
      // Create fresh global admin user
      const created = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.ADMIN,
          businessId: null,
        },
      });
      console.log(`✅ Master Admin user created: ${created.email} (Pure Global Admin)`);
    }

    // 2. Remove any placeholder 'verifyflow-hq' business record
    const hqBusiness = await prisma.business.findUnique({
      where: { slug: 'verifyflow-hq' },
    });

    if (hqBusiness) {
      // Disassociate any users from this business before deleting
      await prisma.user.updateMany({
        where: { businessId: hqBusiness.id },
        data: { businessId: null },
      });

      await prisma.business.delete({
        where: { id: hqBusiness.id },
      });
      console.log(`🗑️ Removed placeholder 'verifyflow-hq' from merchant businesses.`);
    }

    console.log(`\n----------------------------------------`);
    console.log(`📋 ADMIN LOGIN CREDENTIALS:`);
    console.log(`----------------------------------------`);
    console.log(`📧 Email:    ${email}`);
    console.log(`🔒 Password: ${password}`);
    console.log(`🌐 Role:     ADMIN (Global Platform Superuser)`);
    console.log(`🏪 Stores:   0 (Not a merchant subscriber)`);
    console.log(`----------------------------------------\n`);
  } catch (err) {
    console.error('❌ Failed to create/promote admin user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createOrPromoteAdmin();
