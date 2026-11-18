import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../common/services/subscription.service';
import { UpdateBusinessSettingsDto, UpdateTemplateSettingsDto } from './dto/business.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionService,
  ) {}

  async getBusinessProfile(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptionPlan: true,
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

    // A paid period that has run out shows up as EXPIRED so the dashboard asks to renew.
    const expiredStatus = await this.subscriptions.syncExpiredStatus(business);
    if (expiredStatus) {
      business.subscriptionStatus = expiredStatus;
    }

    return business;
  }

  async updateBusinessProfile(businessId: string, data: UpdateBusinessSettingsDto) {
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
        taxId: data.taxId,
        publicVerificationEnabled: data.publicVerificationEnabled,
        customSuccessMessage: data.customSuccessMessage,
        warrantyTerms: data.warrantyTerms,
        receiptFooter: data.receiptFooter,
        receiptTerms: data.receiptTerms,
        receiptPaperSize: data.receiptPaperSize,
      },
    });
  }

  /**
   * There is no free plan to move to. Paid plans are granted only by verified
   * payment (PaymentsService) or by a platform admin.
   */
  async updatePlan(_businessId: string, _planCode: any): Promise<never> {
    throw new ForbiddenException('Plans can only be changed by paying for a plan.');
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
        taxId: true,
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

  async updateTemplateSettings(businessId: string, data: UpdateTemplateSettingsDto) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
    if (data.accountName !== undefined) updateData.accountName = data.accountName;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
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

  async deleteAccount(businessId: string, userId: string, password?: string, confirmText?: string) {
    // 1. Fetch user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 2. OWNER only
    if (user.storeRole !== 'OWNER') {
      throw new ForbiddenException('Only the store owner can delete this account.');
    }

    // 3. Verify identity — password for email/password accounts, "DELETE" text for Google sign-in accounts
    if (password) {
      const valid = user.password ? await bcrypt.compare(password, user.password) : false;
      if (!valid) {
        throw new BadRequestException('Incorrect password. Account was not deleted.');
      }
    } else if (confirmText === 'DELETE') {
      // Google sign-in users have no user-set password — they confirm by typing DELETE
    } else {
      throw new BadRequestException('Please confirm with your password or type DELETE to proceed.');
    }

    // 4. Delete business (cascades all related data via Prisma schema onDelete: Cascade)
    await this.prisma.business.delete({ where: { id: businessId } });

    // 5. Delete the owner user record (business FK is now null due to SetNull)
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }
}
