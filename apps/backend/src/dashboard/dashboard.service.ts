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

  async getReports(businessId: string, range?: string) {
    let startDate = new Date();
    if (range === '7_DAYS') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '90_DAYS') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (range === 'YEAR') {
      startDate = new Date(new Date().getFullYear(), 0, 1);
    } else {
      // Default 30_DAYS
      startDate.setDate(startDate.getDate() - 30);
    }

    const dateFilter = { gte: startDate };

    // 1. Sales revenue within range
    const salesAggregate = await this.prisma.sale.aggregate({
      where: { businessId, paymentStatus: 'PAID', createdAt: dateFilter },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // 2. Devices sold count within range
    const devicesSoldCount = await this.prisma.saleItem.count({
      where: {
        sale: { businessId, paymentStatus: 'PAID', createdAt: dateFilter },
      },
    });

    // 3. New Customers count within range
    const newCustomersCount = await this.prisma.customer.count({
      where: { businessId, createdAt: dateFilter },
    });

    // 4. Repairs revenue within range
    const repairsAggregate = await this.prisma.repairTicket.aggregate({
      where: { businessId, createdAt: dateFilter },
      _sum: { estimatedCost: true, finalCost: true },
      _count: { id: true },
    });

    // 5. Total Revenue = sales + repairs
    const salesRevenue = salesAggregate._sum.totalAmount || 0;
    const repairRevenue = repairsAggregate._sum.finalCost || repairsAggregate._sum.estimatedCost || 0;
    const totalRevenue = salesRevenue + repairRevenue;
    const totalSalesCount = salesAggregate._count.id || 0;
    const avgOrderValue = totalSalesCount > 0 ? Math.round(salesRevenue / totalSalesCount) : 0;

    // 6. Top Selling Models
    const saleItems = await this.prisma.saleItem.findMany({
      where: {
        sale: { businessId, paymentStatus: 'PAID', createdAt: dateFilter },
      },
      include: {
        phoneRecord: { select: { brand: true, model: true } },
      },
    });

    const modelMap = new Map<string, { model: string; category: string; units: number; revenue: number }>();
    saleItems.forEach((item) => {
      const modelName = item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : item.description || 'General Item';
      const category = item.phoneRecord ? 'Smartphone' : 'Accessory / Service';
      const existing = modelMap.get(modelName) || { model: modelName, category, units: 0, revenue: 0 };
      existing.units += 1;
      existing.revenue += item.totalPrice || item.unitPrice || 0;
      modelMap.set(modelName, existing);
    });

    const topSellingModels = Array.from(modelMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 7. Inventory Ageing
    const inStockPhones = await this.prisma.phoneRecord.findMany({
      where: { businessId, status: PhoneStatus.IN_STOCK },
      select: { createdAt: true, sellingPrice: true },
    });

    const now = Date.now();
    let age0_30 = 0;
    let age31_60 = 0;
    let age61_90 = 0;
    let age90_plus = 0;

    inStockPhones.forEach((p) => {
      const days = Math.floor((now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const val = p.sellingPrice || 0;
      if (days <= 30) age0_30 += val;
      else if (days <= 60) age31_60 += val;
      else if (days <= 90) age61_90 += val;
      else age90_plus += val;
    });

    // 8. Repair Status Breakdown
    const repairTickets = await this.prisma.repairTicket.findMany({
      where: { businessId, createdAt: dateFilter },
      select: { status: true },
    });

    let completedRepairs = 0;
    let pendingRepairs = 0;
    let delayedRepairs = 0;

    repairTickets.forEach((t) => {
      if (t.status === 'COMPLETED' || t.status === 'READY_FOR_PICKUP') completedRepairs++;
      else if (t.status === 'IN_PROGRESS' || t.status === 'DIAGNOSING') pendingRepairs++;
      else delayedRepairs++;
    });

    return {
      range: range || '30_DAYS',
      kpis: {
        totalRevenue,
        salesRevenue,
        totalSalesCount,
        devicesSoldCount,
        avgOrderValue,
        newCustomersCount,
        repairRevenue,
      },
      topSellingModels,
      inventoryAgeing: {
        age0_30,
        age31_60,
        age61_90,
        age90_plus,
        totalValueAtRisk: age90_plus,
      },
      repairBreakdown: {
        completed: completedRepairs,
        pending: pendingRepairs,
        delayed: delayedRepairs,
        total: repairTickets.length,
      },
    };
  }
}
