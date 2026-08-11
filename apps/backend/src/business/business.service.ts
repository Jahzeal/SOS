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

  async getTemplateSettings(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        receiptFooter: true,
        receiptTerms: true,
        warrantyTerms: true,
        receiptPaperSize: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async updateTemplateSettings(businessId: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.receiptFooter !== undefined) updateData.receiptFooter = data.receiptFooter;
    if (data.receiptTerms !== undefined) updateData.receiptTerms = data.receiptTerms;
    if (data.warrantyTerms !== undefined) updateData.warrantyTerms = data.warrantyTerms;
    if (data.receiptPaperSize !== undefined) updateData.receiptPaperSize = data.receiptPaperSize;

    return this.prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });
  }
}
