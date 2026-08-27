import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from './guards/admin.guard';

// Dashboard
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';

// Businesses
import { AdminBusinessesController } from './businesses/admin-businesses.controller';
import { AdminBusinessesService } from './businesses/admin-businesses.service';

// Subscriptions
import { AdminSubscriptionsController } from './subscriptions/admin-subscriptions.controller';
import { AdminSubscriptionsService } from './subscriptions/admin-subscriptions.service';

// Transactions
import { AdminTransactionsController } from './transactions/admin-transactions.controller';
import { AdminTransactionsService } from './transactions/admin-transactions.service';

// Support
import { AdminSupportController } from './support/admin-support.controller';
import { AdminSupportService } from './support/admin-support.service';

// Notifications
import { AdminNotificationsController } from './notifications/admin-notifications.controller';
import { AdminNotificationsService } from './notifications/admin-notifications.service';

// Settings
import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminSettingsService } from './settings/admin-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminDashboardController,
    AdminBusinessesController,
    AdminSubscriptionsController,
    AdminTransactionsController,
    AdminSupportController,
    AdminNotificationsController,
    AdminSettingsController,
  ],
  providers: [
    AdminGuard,
    AdminDashboardService,
    AdminBusinessesService,
    AdminSubscriptionsService,
    AdminTransactionsService,
    AdminSupportService,
    AdminNotificationsService,
    AdminSettingsService,
  ],
  exports: [
    AdminGuard,
    AdminDashboardService,
    AdminBusinessesService,
    AdminSubscriptionsService,
    AdminTransactionsService,
    AdminSupportService,
    AdminNotificationsService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
