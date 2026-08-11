import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        publicVerificationEnabled: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business store not found.');
    }

    // 1. Phone Inventory Counts
    const [totalRegistered, inStockCount, soldCount, inRepairCount] = await Promise.all([
      this.prisma.phoneRecord.count({ where: { businessId } }),
      this.prisma.phoneRecord.count({ where: { businessId, status: PhoneStatus.IN_STOCK } }),
      this.prisma.phoneRecord.count({ where: { businessId, status: PhoneStatus.SOLD } }),
      this.prisma.phoneRecord.count({ where: { businessId, status: PhoneStatus.IN_REPAIR } }),
    ]);

    // 2. Active Warranties Count
    const activeWarrantiesCount = await this.prisma.phoneRecord.count({
      where: {
        businessId,
        warrantyExpiryDate: {
          gt: new Date(),
        },
      },
    });

    // 3. Stock Valuation Aggregate
    const stockValuationAggregate = await this.prisma.phoneRecord.aggregate({
      where: { businessId, status: PhoneStatus.IN_STOCK },
      _sum: {
        sellingPrice: true,
        purchasePrice: true,
      },
    });

    // 4. Sales Revenue Aggregate
    const salesAggregate = await this.prisma.sale.aggregate({
      where: { businessId, paymentStatus: 'PAID' },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // 5. Recent Phone Registrations (Top 10)
    const recentPhones = await this.prisma.phoneRecord.findMany({
      where: { businessId },
      include: {
        customer: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 6. Recent Sales Receipts (Top 5)
    const recentSales = await this.prisma.sale.findMany({
      where: { businessId },
      include: {
        customer: {
          select: { name: true },
        },
        items: {
          include: {
            phoneRecord: {
              select: { brand: true, model: true, imei1: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      business,
      kpis: {
        totalRegistered,
        inStockCount,
        soldCount,
        inRepairCount,
        activeWarrantiesCount,
        stockValuation: stockValuationAggregate._sum.sellingPrice || 0,
        totalSalesRevenue: salesAggregate._sum.totalAmount || 0,
        totalSalesCount: salesAggregate._count.id || 0,
      },
      recentPhones,
      recentSales,
    };
  }
}
