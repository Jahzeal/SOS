import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPhoneDto } from './dto/phone-record.dto';
import { DeviceIntelligenceService } from './device-intelligence.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private deviceIntel: DeviceIntelligenceService,
  ) {}

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
    const cleanId = identifier.trim();

    // 1. Check for Active Theft / Lost Mode Reports
    const activeTheftReport = await this.prisma.theftReport.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { imei1: cleanId },
          { imei2: cleanId },
          { serialNumber: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Check for matching Phone Record in Business Inventories
    const phone = await this.prisma.phoneRecord.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { imei1: cleanId },
          { imei2: cleanId },
          { serialNumber: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            publicVerificationEnabled: true,
            customSuccessMessage: true,
            warrantyTerms: true,
          },
        },
      },
    });

    // 3. Fallback TAC / Hardware Profile
    const tacProfile = this.deviceIntel.parseTac(cleanId);

    const isStolen = !!activeTheftReport || phone?.isStolen || phone?.theftStatus === 'STOLEN';
    const theftStatus = isStolen ? 'STOLEN' : 'CLEAN';

    const ownerMessage = activeTheftReport?.lostNote || phone?.lostNote || (isStolen ? 'This device has been flagged as stolen in the registry.' : null);
    const contactPhone = activeTheftReport?.ownerPhone || phone?.contactPhone || null;
    const ownerName = activeTheftReport?.ownerName || (phone?.theftReportedBy ? 'Verified Business Reporter' : null);
    const reportedAt = activeTheftReport?.createdAt || phone?.stolenAt || null;

    const carrierStatus = phone?.carrierStatus || tacProfile.defaultCarrierStatus;
    const lockedCarrier = phone?.lockedCarrier || tacProfile.likelyCarrier;
    const activationStatus = phone?.activationStatus || (isStolen ? 'ACTIVATED' : (phone ? 'READY_FOR_SETUP' : tacProfile.defaultActivationStatus));

    // Log the verification attempt
    this.prisma.verificationLog.create({
      data: {
        identifier: cleanId.slice(0, 50),
        status: isStolen ? 'FLAGGED_STOLEN' : (phone ? 'VERIFIED' : 'NOT_FOUND'),
        businessId: phone?.businessId || null,
      },
    }).catch(() => {});

    if (phone) {
      const isWarrantyActive = phone.warrantyExpiryDate ? new Date() <= new Date(phone.warrantyExpiryDate) : false;

      return {
        verified: true,
        isRegisteredInNetwork: true,
        theftStatus,
        isStolen,
        ownerMessage,
        contactPhone,
        ownerName,
        reportedAt,
        carrierStatus,
        lockedCarrier,
        activationStatus,
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
          slug: phone.business.slug,
          logoUrl: phone.business.logoUrl,
        },
      };
    }

    // If not registered by a merchant, return TAC profile + theft status
    return {
      verified: !isStolen,
      isRegisteredInNetwork: false,
      theftStatus,
      isStolen,
      ownerMessage,
      contactPhone,
      ownerName,
      reportedAt,
      carrierStatus,
      lockedCarrier,
      activationStatus,
      deviceInfo: {
        brand: activeTheftReport?.brand || tacProfile.brand || 'Smartphone Device',
        model: activeTheftReport?.model || tacProfile.model || 'Mobile Device',
        color: activeTheftReport?.color || null,
        storageCapacity: null,
        condition: null,
        serialNumber: activeTheftReport?.serialNumber ? `${activeTheftReport.serialNumber.slice(0, 3)}****` : null,
        registeredAt: activeTheftReport?.createdAt || null,
      },
      warranty: null,
      retailer: null,
      message: isStolen
        ? '🚨 WARNING: This device has been reported as STOLEN in the registry.'
        : 'Device verified clean in global theft registry.',
    };
  }
}

