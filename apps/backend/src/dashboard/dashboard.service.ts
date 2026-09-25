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
        logoUrl: true,
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

    // 5. Calculate Gross Profit from Sold Phones
    const soldPhones = await this.prisma.phoneRecord.findMany({
      where: { businessId, status: PhoneStatus.SOLD },
      select: { sellingPrice: true, purchasePrice: true },
    });

    const totalSoldRevenue = soldPhones.reduce((sum, p) => sum + (p.sellingPrice || 0), 0);
    const totalSoldCost = soldPhones.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalProfit = Math.max(0, totalSoldRevenue - totalSoldCost);
    const profitMargin = totalSoldRevenue > 0 ? Math.round((totalProfit / totalSoldRevenue) * 100) : 0;

    // 6. Recent Phone Registrations (Top 10)
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

    // 7. Recent Sales Receipts (Top 5)
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
        totalSalesRevenue: salesAggregate._sum.totalAmount || totalSoldRevenue,
        totalSalesCount: salesAggregate._count.id || soldCount,
        totalProfit,
        profitMargin,
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

    // Calculate gross profit for the period
    const rangeSoldPhones = await this.prisma.phoneRecord.findMany({
      where: { businessId, status: PhoneStatus.SOLD, updatedAt: dateFilter },
      select: { sellingPrice: true, purchasePrice: true },
    });
    const rangeSoldRevenue = rangeSoldPhones.reduce((sum, p) => sum + (p.sellingPrice || 0), 0);
    const rangeSoldCost = rangeSoldPhones.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalProfit = Math.max(0, rangeSoldRevenue - rangeSoldCost);
    const profitMargin = rangeSoldRevenue > 0 ? Math.round((totalProfit / rangeSoldRevenue) * 100) : 0;

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
        totalProfit,
        profitMargin,
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

  async getNotifications(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business store not found.');
    }

    // 1. Recent Phone Registrations (up to 5)
    const recentPhones = await this.prisma.phoneRecord.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        brand: true,
        model: true,
        imei1: true,
        createdAt: true,
        warrantyDurationMonths: true,
      },
    });

    // 2. Recent Sales (up to 5)
    const recentSales = await this.prisma.sale.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        receiptNumber: true,
        invoiceNumber: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    });

    // 3. Recent Repairs (up to 3)
    const recentRepairs = await this.prisma.repairTicket.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        issueDescription: true,
        updatedAt: true,
      },
    });

    // 4. Support Tickets (up to 3)
    const recentTickets = await this.prisma.supportTicket.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        updatedAt: true,
      },
    });

    const notifications: Array<{
      id: string;
      title: string;
      description: string;
      createdAt: Date;
      icon: 'phone' | 'shield' | 'receipt' | 'bell';
      href: string;
    }> = [];

    // Devices & Warranty
    for (const phone of recentPhones) {
      notifications.push({
        id: `phone_${phone.id}`,
        title: 'New Device Registered',
        description: `${phone.brand} ${phone.model} (IMEI: ${phone.imei1.slice(0, 6)}...) added to store stock.`,
        createdAt: phone.createdAt,
        icon: 'phone',
        href: '/dashboard/records',
      });

      if (phone.warrantyDurationMonths > 0) {
        notifications.push({
          id: `warranty_${phone.id}`,
          title: 'Store Guarantee Active',
          description: `${phone.warrantyDurationMonths}-Month warranty registered for ${phone.brand} ${phone.model}.`,
          createdAt: phone.createdAt,
          icon: 'shield',
          href: '/dashboard/records',
        });
      }
    }

    // Sales
    for (const sale of recentSales) {
      const receiptRef = sale.receiptNumber || sale.invoiceNumber;
      const customerStr = sale.customer?.name ? ` for ${sale.customer.name}` : '';
      notifications.push({
        id: `sale_${sale.id}`,
        title: 'POS Checkout Completed',
        description: `Receipt #${receiptRef}: ₦${Number(sale.totalAmount).toLocaleString()} registered${customerStr}.`,
        createdAt: sale.createdAt,
        icon: 'receipt',
        href: '/dashboard/records',
      });
    }

    // Repairs
    for (const repair of recentRepairs) {
      notifications.push({
        id: `repair_${repair.id}`,
        title: `Repair #${repair.ticketNumber}`,
        description: `Status: ${repair.status.replace(/_/g, ' ')} — ${repair.issueDescription.slice(0, 50)}`,
        createdAt: repair.updatedAt,
        icon: 'phone',
        href: '/dashboard/repairs',
      });
    }

    // Support Tickets
    for (const ticket of recentTickets) {
      notifications.push({
        id: `ticket_${ticket.id}`,
        title: `Support Ticket #${ticket.ticketNumber}`,
        description: `"${ticket.subject}" is marked as ${ticket.status.replace(/_/g, ' ')}.`,
        createdAt: ticket.updatedAt,
        icon: 'bell',
        href: '/dashboard/support',
      });
    }

    // Workspace / Trial Status notification
    if (business.trialEndsAt) {
      const diffDays = Math.ceil((new Date(business.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `biz_trial_${business.id}`,
        title: 'Workspace Initialized',
        description:
            diffDays > 0
            ? `Welcome to NoxGuarda! ${diffDays}-day free trial active.`
            : 'Your free trial has ended. Upgrade to continue syncing store records.',
        createdAt: business.createdAt,
        icon: 'bell',
        href: '/dashboard/settings',
      });
    } else {
      notifications.push({
        id: `biz_welcome_${business.id}`,
        title: 'Workspace Active',
        description: `Store ${business.name} is running with active inventory sync.`,
        createdAt: business.createdAt,
        icon: 'bell',
        href: '/dashboard',
      });
    }

    // Sort chronologically (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: notifications.slice(0, 15),
    };
  }
}
