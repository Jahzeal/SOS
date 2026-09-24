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
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        publicVerificationEnabled: data.publicVerificationEnabled,
        customSuccessMessage: data.customSuccessMessage,
        warrantyTerms: data.warrantyTerms,
        receiptFooter: data.receiptFooter,
        receiptTerms: data.receiptTerms,
        receiptPaperSize: data.receiptPaperSize,
      },
    });
  }

  async updatePlan(businessId: string, planCode: any) {
    const cleanPlan = (planCode || 'FREE').toUpperCase();
    const subPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: cleanPlan },
    });

    const isFree = cleanPlan === 'FREE' || cleanPlan === 'BASIC';

    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        plan: cleanPlan,
        planId: subPlan ? subPlan.id : undefined,
        subscriptionStatus: isFree ? 'FREE' : undefined,
      },
      include: {
        subscriptionPlan: true,
      },
    });
  }

  async getTemplateSettings(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        address: true,
        phone: true,
        email: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        receiptFooter: true,
        receiptTerms: true,
        warrantyTerms: true,
        receiptPaperSize: true,
        quoteTitle: true,
        quoteTerms: true,
        quoteNotes: true,
        quoteValidityDays: true,
        quoteAccentColor: true,
        quoteShowBankDetails: true,
        quoteShowSignature: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async updateTemplateSettings(businessId: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
    if (data.accountName !== undefined) updateData.accountName = data.accountName;
    if (data.receiptFooter !== undefined) updateData.receiptFooter = data.receiptFooter;
    if (data.receiptTerms !== undefined) updateData.receiptTerms = data.receiptTerms;
    if (data.warrantyTerms !== undefined) updateData.warrantyTerms = data.warrantyTerms;
    if (data.receiptPaperSize !== undefined) updateData.receiptPaperSize = data.receiptPaperSize;

    // Quote Settings
    if (data.quoteTitle !== undefined) updateData.quoteTitle = data.quoteTitle;
    if (data.quoteTerms !== undefined) updateData.quoteTerms = data.quoteTerms;
    if (data.quoteNotes !== undefined) updateData.quoteNotes = data.quoteNotes;
    if (data.quoteValidityDays !== undefined) updateData.quoteValidityDays = Number(data.quoteValidityDays);
    if (data.quoteAccentColor !== undefined) updateData.quoteAccentColor = data.quoteAccentColor;
    if (data.quoteShowBankDetails !== undefined) updateData.quoteShowBankDetails = Boolean(data.quoteShowBankDetails);
    if (data.quoteShowSignature !== undefined) updateData.quoteShowSignature = Boolean(data.quoteShowSignature);

    return this.prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });
  }
}
