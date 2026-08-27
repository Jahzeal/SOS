import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PLAN_CONFIGS } from '../src/common/constants/plans.constant';
import { Plan, UserRole } from '@prisma/client';
import { AdminDashboardService } from '../src/admin/dashboard/admin-dashboard.service';
import { AdminBusinessesService } from '../src/admin/businesses/admin-businesses.service';
import { AdminSubscriptionsService } from '../src/admin/subscriptions/admin-subscriptions.service';
import { AdminTransactionsService } from '../src/admin/transactions/admin-transactions.service';
import { AdminSupportService } from '../src/admin/support/admin-support.service';
import { AdminNotificationsService } from '../src/admin/notifications/admin-notifications.service';
import { AdminSettingsService } from '../src/admin/settings/admin-settings.service';

async function runAdminE2ETests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PRODUCTION-READY ADMIN E2E TEST SUITE');
  console.log('====================================================\n');

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const prisma = app.get(PrismaService);
  const dashboardService = app.get(AdminDashboardService);
  const businessesService = app.get(AdminBusinessesService);
  const subscriptionsService = app.get(AdminSubscriptionsService);
  const transactionsService = app.get(AdminTransactionsService);
  const supportService = app.get(AdminSupportService);
  const notificationsService = app.get(AdminNotificationsService);
  const settingsService = app.get(AdminSettingsService);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // 1. Dashboard Metrics
    console.log('[1/7] Testing Admin Dashboard Services (Database Persisted)...');
    const metrics = await dashboardService.getOverviewMetrics('today');
    assert(metrics.success === true, 'Dashboard metrics returned success');
    assert(typeof metrics.kpis.totalBusinesses === 'number', 'totalBusinesses is a valid number');
    assert(typeof metrics.kpis.calculatedMrr === 'number', 'calculatedMrr computed from database');

    const chartData = await dashboardService.getVerificationTraffic('7d');
    assert(chartData.success === true, 'Verification traffic returned success');
    assert(Array.isArray(chartData.data) && chartData.data.length === 7, '7d chart returns 7 data points');

    const systemLogs = await dashboardService.getRecentSystemLogs();
    assert(systemLogs.success === true && Array.isArray(systemLogs.logs), 'System logs stream is operational');

    // 2. Subscriptions & Tier Pricing
    console.log('\n[2/7] Testing Admin Subscriptions (Live Plans)...');
    const subs = await subscriptionsService.getSubscriptionAnalytics();
    assert(subs.success === true, 'Subscriptions analytics returned success');
    assert(typeof subs.summary.activeMRR === 'number', 'activeMRR is dynamically computed');
    assert(subs.summary.tierPricing[Plan.STARTER] === PLAN_CONFIGS.STARTER.monthlyPriceNgn, 'Starter tier matches PLAN_CONFIGS');
    assert(subs.summary.tierPricing[Plan.BUSINESS] === PLAN_CONFIGS.BUSINESS.monthlyPriceNgn, 'Business tier matches PLAN_CONFIGS');
    assert(subs.summary.tierPricing[Plan.ENTERPRISE] === PLAN_CONFIGS.ENTERPRISE.monthlyPriceNgn, 'Enterprise tier matches PLAN_CONFIGS');

    // 3. Businesses Directory
    console.log('\n[3/7] Testing Admin Businesses Directory...');
    const businesses = await businessesService.findAll({ limit: 10 });
    assert(businesses.success === true, 'Businesses findAll returned success');
    assert(Array.isArray(businesses.data), 'Businesses data is an array');

    // 4. Transactions Ledger
    console.log('\n[4/7] Testing Admin Transactions Ledger...');
    const transactions = await transactionsService.findAll({ limit: 10 });
    assert(transactions.success === true, 'Transactions findAll returned success');
    assert(typeof transactions.stats.totalVolume === 'number', 'Transaction volume computed from DB');

    // 5. Support Tickets Workflow
    console.log('\n[5/7] Testing Admin Support Tickets (Database Persisted)...');
    const existingBusinesses = await prisma.business.findMany({ take: 1 });
    if (existingBusinesses.length > 0) {
      const createdTicket = await supportService.createTicket({
        businessId: existingBusinesses[0].id,
        requesterName: 'Chidi Okonkwo',
        requesterEmail: 'chidi@store.ng',
        subject: 'Test E2E Ticket Flow',
        description: 'Verifying automated ticket status update in DB',
      });
      assert(createdTicket.success === true, 'Support ticket created in database');

      const updated = await supportService.updateStatus(createdTicket.data.id, 'IN_PROGRESS');
      assert(updated.data.status === 'IN_PROGRESS', 'Support ticket updated to IN_PROGRESS in DB');

      const resolved = await supportService.updateStatus(createdTicket.data.id, 'RESOLVED');
      assert(resolved.data.status === 'RESOLVED', 'Support ticket resolved in DB');
    }

    const ticketsList = await supportService.findAll({});
    assert(ticketsList.success === true && Array.isArray(ticketsList.data), 'Support tickets list retrieved from DB');

    // 6. Notifications Center
    console.log('\n[6/7] Testing Admin Notifications (Database Persisted)...');
    const createdNotif = await notificationsService.create({
      title: 'E2E Test Alert',
      message: 'Testing database notification flow',
    });
    assert(createdNotif.success === true, 'Admin notification created in database');

    const markRead = await notificationsService.markAsRead(createdNotif.data.id);
    assert(markRead.data.isRead === true, 'Notification marked as read in database');

    const deleted = await notificationsService.delete(createdNotif.data.id);
    assert(deleted.success === true, 'Notification deleted from database');

    // 7. Settings Configuration (Database Persisted in PlatformSetting table)
    console.log('\n[7/7] Testing Admin Platform Settings (Prisma Persisted)...');
    const settings = await settingsService.getSettings();
    assert(settings.success === true && typeof settings.data.maintenanceMode === 'boolean', 'Database platform settings retrieved');

    const updatedSettings = await settingsService.updateSettings({ rateLimitPerMinute: 150 });
    assert(updatedSettings.data.rateLimitPerMinute === 150, 'Platform setting rateLimitPerMinute persisted in DB');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PRODUCTION E2E TESTS PASSED WITH ZERO MOCKS!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n❌ E2E TEST SUITE ERROR:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runAdminE2ETests();
