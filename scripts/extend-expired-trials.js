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

async function extendTrials({ includeJahzealStores = true, dryRun = true } = {}) {
  try {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    console.log(`\n========================================`);
    console.log(` EXTEND EXPIRED FREE TIER TRIALS`);
    console.log(` Mode: ${dryRun ? 'DRY RUN (no DB changes)' : 'LIVE EXECUTION (updating DB)'}`);
    console.log(` Current Time: ${now.toISOString()}`);
    console.log(` Target Expiry (+14 days): ${twoWeeksFromNow.toISOString()}`);
    console.log(` Include personal test stores: ${includeJahzealStores}`);
    console.log(`========================================\n`);

    // 1. Fetch businesses with users
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const toUpdate = [];

    for (const b of businesses) {
      // Exclude if business has an ADMIN role user (pure Super Admin protection)
      const hasAdmin = b.users.some(u => u.role === 'ADMIN');
      if (hasAdmin) {
        console.log(`[SKIP] Business '${b.name}' has ADMIN user. Skipping.`);
        continue;
      }

      // Skip active paid subscriptions
      if (b.subscriptionStatus === 'ACTIVE') {
        console.log(`[SKIP] Business '${b.name}' has ACTIVE paid subscription. Skipping.`);
        continue;
      }

      // Check if trial has expired
      const trialEndsAt = b.trialEndsAt ? new Date(b.trialEndsAt) : null;
      const isExpired = !trialEndsAt || trialEndsAt.getTime() <= now.getTime();

      if (!isExpired) {
        console.log(`[SKIP] Business '${b.name}' is still active until ${trialEndsAt.toISOString()}. Skipping.`);
        continue;
      }

      // Check if it belongs to jahzeal test accounts
      const isJahzealStore = b.users.some(u => u.email.toLowerCase().includes('jahzeal'));
      if (isJahzealStore && !includeJahzealStores) {
        console.log(`[SKIP] Business '${b.name}' (${b.users.map(u => u.email).join(', ')}) skipped (test store filter).`);
        continue;
      }

      toUpdate.push({
        id: b.id,
        name: b.name,
        plan: b.plan,
        oldTrialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : 'NULL',
        newTrialEndsAt: twoWeeksFromNow.toISOString(),
        users: b.users.map(u => u.email).join(', ')
      });
    }

    console.log(`\nFound ${toUpdate.length} expired store(s) to extend:`);
    toUpdate.forEach((item, i) => {
      console.log(`  [${i + 1}] ${item.name} (${item.users})`);
      console.log(`      Previous Expiry: ${item.oldTrialEndsAt} -> New Expiry: ${item.newTrialEndsAt}`);
    });

    if (!dryRun && toUpdate.length > 0) {
      console.log(`\nExecuting database updates...`);
      for (const item of toUpdate) {
        await prisma.business.update({
          where: { id: item.id },
          data: {
            trialEndsAt: twoWeeksFromNow,
            subscriptionStatus: 'TRIAL'
          }
        });
        console.log(`  ✓ Updated ${item.name}`);
      }
      console.log(`\nSUCCESS: Successfully extended ${toUpdate.length} stores to ${twoWeeksFromNow.toISOString()} (14 days).`);
    } else if (dryRun) {
      console.log(`\nDry run complete. No modifications were written to the database.`);
    }
  } catch (err) {
    console.error('Error running trial extension:', err);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments: --live, --client-only
const isLive = process.argv.includes('--live');
const clientOnly = process.argv.includes('--client-only');

extendTrials({
  includeJahzealStores: !clientOnly,
  dryRun: !isLive
});
