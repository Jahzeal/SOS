import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private prisma: PrismaService) {}

  async getPublicPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      success: true,
      plans,
    };
  }

  async getPlanByCode(code: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: code.toUpperCase() },
    });
    return plan;
  }
}

