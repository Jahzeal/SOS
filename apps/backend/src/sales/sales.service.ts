import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { PhoneStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async checkout(businessId: string, userId: string, dto: CheckoutSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one device item is required for POS checkout.');
    }

    // 1. Verify items exist & in stock
    const itemIds = dto.items.map((i) => i.phoneRecordId);
    const phones = await this.prisma.phoneRecord.findMany({
      where: {
        id: { in: itemIds },
        businessId,
      },
    });

    if (phones.length !== itemIds.length) {
      throw new NotFoundException('One or more selected devices were not found in store inventory.');
    }

    const soldDevice = phones.find((p) => p.status === PhoneStatus.SOLD);
    if (soldDevice) {
      throw new BadRequestException(`Device ${soldDevice.brand} ${soldDevice.model} (IMEI: ${soldDevice.imei1}) is already marked as SOLD.`);
    }

    // 2. Link or Create Customer
    let customerId: string | undefined = undefined;
    if (dto.customerPhone) {
      let customer = await this.prisma.customer.findFirst({
        where: {
          businessId,
          phone: dto.customerPhone.trim(),
        },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            businessId,
            name: dto.customerName?.trim() || 'Retail Buyer',
            phone: dto.customerPhone.trim(),
            email: dto.customerEmail?.trim(),
          },
        });
      }
      customerId = customer.id;
    }

    // 3. Compute Totals & Generate Invoice + Receipt Numbers
    const totalAmount = dto.items.reduce((sum, item) => sum + item.price, 0);
    const ref = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `VF-INV-${ref}`;
    const receiptNumber = `VF-REC-${ref}`;

    // 5. Run Prisma Transaction to create sale & mark phones SOLD
    const sale = await this.prisma.$transaction(async (tx) => {
      // Create Sale Record
      const newSale = await tx.sale.create({
        data: {
          businessId,
          customerId,
          soldById: userId,
          invoiceNumber,
          receiptNumber,
          totalAmount,
          paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
          paymentStatus: 'PAID',
          items: {
            create: dto.items.map((item) => {
              const phone = phones.find((p) => p.id === item.phoneRecordId)!;
              return {
                phoneRecordId: item.phoneRecordId,
                description: `${phone.brand} ${phone.model} (IMEI: ${phone.imei1})`,
                unitPrice: item.price,
                totalPrice: item.price,
              };
            }),
          },
        },
        include: {
          customer: true,
          business: {
            select: { name: true, phone: true, address: true, warrantyTerms: true, customSuccessMessage: true },
          },
          items: {
            include: {
              phoneRecord: true,
            },
          },
        },
      });

      // Update phone statuses to SOLD & link customerId
      await tx.phoneRecord.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: PhoneStatus.SOLD,
          customerId,
        },
      });

      return newSale;
    });

    return sale;
  }

  async findAllReceipts(businessId: string, search?: string) {
    const where: any = { businessId };

    if (search) {
      const q = search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneReceipt(businessId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        businessId,
        OR: [{ id }, { invoiceNumber: id }, { receiptNumber: id }],
      },
      include: {
        customer: true,
        business: true,
        items: {
          include: {
            phoneRecord: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Receipt ${id} not found.`);
    }

    return sale;
  }
}
