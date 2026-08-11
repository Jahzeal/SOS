import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string, search?: string) {
    const where: any = { businessId };

    if (search) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        phoneRecords: {
          select: {
            id: true,
            model: true,
            brand: true,
            imei1: true,
            warrantyExpiryDate: true,
            createdAt: true,
          },
        },
        sales: {
          select: {
            id: true,
            totalAmount: true,
            invoiceNumber: true,
            receiptNumber: true,
            createdAt: true,
            items: {
              select: {
                description: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        repairs: {
          select: {
            id: true,
            ticketNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const totalSpending = c.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const devicesCount = c.phoneRecords.length;
      const lastSale = c.sales[0];
      const lastPurchaseDate = lastSale
        ? new Date(lastSale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'No purchases';
      const lastPurchaseItem = lastSale?.items?.[0]?.description || 'N/A';

      return {
        ...c,
        devicesCount,
        totalSpending,
        lastPurchaseDate,
        lastPurchaseItem,
      };
    });
  }

  async findOne(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        phoneRecords: true,
        sales: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        repairs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found.`);
    }

    const totalSpending = customer.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

    return {
      ...customer,
      totalSpending,
      devicesCount: customer.phoneRecords.length,
    };
  }

  async create(businessId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        businessId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      },
    });
  }

  async update(businessId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(businessId, id);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
