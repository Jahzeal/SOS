import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VerificationModule } from './verification/verification.module';
import { BusinessModule } from './business/business.module';
import { PhonesModule } from './phones/phones.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { RepairsModule } from './repairs/repairs.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { PlansModule } from './plans/plans.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    PlansModule,
    AuthModule,
    VerificationModule,
    BusinessModule,
    PhonesModule,
    DashboardModule,
    SalesModule,
    CustomersModule,
    RepairsModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
