import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async getBusinessProfile(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            users: true,
            phoneRecords: true,
            customers: true,
            sales: true,
            repairs: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async updateBusinessProfile(businessId: string, data: any) {
    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        address: data.address,
        phone: data.phone,
        email: data.email,
        publicVerificationEnabled: data.publicVerificationEnabled,
        customSuccessMessage: data.customSuccessMessage,
        warrantyTerms: data.warrantyTerms,
        receiptFooter: data.receiptFooter,
        receiptTerms: data.receiptTerms,
        receiptPaperSize: data.receiptPaperSize,
      },
    });
  }

  async updatePlan(businessId: string, plan: any) {
    return this.prisma.business.update({
      where: { id: businessId },
      data: { plan },
    });
  }
}
