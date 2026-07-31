import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPhoneDto } from './dto/phone-record.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async registerPhone(businessId: string, userId: string, dto: RegisterPhoneDto) {
    // Check if IMEI1 already registered under this business
    const existing = await this.prisma.phoneRecord.findFirst({
      where: {
        businessId,
        imei1: dto.imei1,
      },
    });

    if (existing) {
      throw new ConflictException(`Phone with IMEI ${dto.imei1} is already registered.`);
    }

    let warrantyExpiryDate: Date | null = null;
    if (dto.warrantyDurationMonths && dto.warrantyDurationMonths > 0) {
      warrantyExpiryDate = new Date();
      warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + dto.warrantyDurationMonths);
    }

    // Create record first
    const record = await this.prisma.phoneRecord.create({
      data: {
        businessId,
        registeredById: userId,
        imei1: dto.imei1,
        imei2: dto.imei2,
        serialNumber: dto.serialNumber,
        brand: dto.brand,
        model: dto.model,
        color: dto.color,
        storageCapacity: dto.storageCapacity,
        condition: dto.condition,
        status: dto.status,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        warrantyDurationMonths: dto.warrantyDurationMonths || 0,
        warrantyExpiryDate,
        customerId: dto.customerId,
      },
    });

    // Generate QR code data URL for public verification link
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${record.id}`;
    let qrCodeUrl = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(verificationUrl);
    } catch (e) {
      console.error('Failed to generate QR code:', e);
    }

    if (qrCodeUrl) {
      return this.prisma.phoneRecord.update({
        where: { id: record.id },
        data: { qrCodeUrl },
        include: { registeredBy: { select: { firstName: true, lastName: true, email: true } }, customer: true },
      });
    }

    return record;
  }

  async getPhones(businessId: string, query?: string) {
    const where: any = { businessId };
    if (query) {
      where.OR = [
        { imei1: { contains: query, mode: 'insensitive' } },
        { imei2: { contains: query, mode: 'insensitive' } },
        { serialNumber: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.phoneRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        registeredBy: { select: { firstName: true, lastName: true } },
        customer: true,
      },
    });
  }

  async getPhoneDetails(businessId: string, id: string) {
    const phone = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
      include: {
        registeredBy: { select: { firstName: true, lastName: true, email: true } },
        customer: true,
        repairs: true,
      },
    });

    if (!phone) {
      throw new NotFoundException('Phone record not found');
    }

    return phone;
  }

  async searchByImei(businessId: string, imei: string) {
    const phones = await this.prisma.phoneRecord.findMany({
      where: {
        businessId,
        OR: [
          { imei1: { equals: imei } },
          { imei2: { equals: imei } },
        ],
      },
      include: { customer: true },
    });

    return phones;
  }

  async searchBySerial(businessId: string, serial: string) {
    return this.prisma.phoneRecord.findMany({
      where: {
        businessId,
        serialNumber: { equals: serial, mode: 'insensitive' },
      },
      include: { customer: true },
    });
  }

  // Public Verification Portal (No authentication required)
  async publicVerify(identifier: string) {
    // identifier can be record ID, IMEI, or Serial Number
    const phone = await this.prisma.phoneRecord.findFirst({
      where: {
        OR: [
          { id: identifier },
          { imei1: identifier },
          { imei2: identifier },
          { serialNumber: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      include: {
        business: {
          select: {
            name: true,
            logoUrl: true,
            publicVerificationEnabled: true,
            customSuccessMessage: true,
            warrantyTerms: true,
          },
        },
      },
    });

    if (!phone) {
      return {
        verified: false,
        message: 'No registered device found matching this identifier. Proceed with caution.',
      };
    }

    if (!phone.business.publicVerificationEnabled) {
      return {
        verified: false,
        message: 'Public verification is disabled for this retailer.',
      };
    }

    const isWarrantyActive = phone.warrantyExpiryDate ? new Date() <= new Date(phone.warrantyExpiryDate) : false;

    return {
      verified: true,
      message: phone.business.customSuccessMessage || 'This device is verified authentic by retailer.',
      deviceInfo: {
        brand: phone.brand,
        model: phone.model,
        color: phone.color,
        storageCapacity: phone.storageCapacity,
        condition: phone.condition,
        serialNumber: phone.serialNumber ? `${phone.serialNumber.slice(0, 3)}****` : null,
        registeredAt: phone.createdAt,
      },
      warranty: {
        isWarrantyActive,
        warrantyDurationMonths: phone.warrantyDurationMonths,
        expiryDate: phone.warrantyExpiryDate,
        terms: phone.business.warrantyTerms,
      },
      retailer: {
        name: phone.business.name,
        logoUrl: phone.business.logoUrl,
      },
    };
  }
}
