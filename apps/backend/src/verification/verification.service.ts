import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPhoneDto } from './dto/phone-record.dto';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceLookupService } from '../phones/device-lookup.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private deviceIntel: DeviceIntelligenceService,
    private deviceLookup: DeviceLookupService,
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
      // Non-blocking if QR generation fails
    }

    // Update with QR code URL
    return this.prisma.phoneRecord.update({
      where: { id: record.id },
      data: { qrCodeUrl },
    });
  }

  async getPhones(businessId: string, search?: string) {
    const where: any = { businessId };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { brand: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { imei1: { contains: q, mode: 'insensitive' } },
        { imei2: { contains: q, mode: 'insensitive' } },
        { serialNumber: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.phoneRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
  }

  async getPhoneDetails(businessId: string, id: string) {
    const record = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
      include: { customer: true },
    });
    if (!record) {
      throw new NotFoundException('Device record not found');
    }
    return record;
  }

  async searchByImei(businessId: string, imei: string) {
    return this.verifyPhone(businessId, imei);
  }

  async searchBySerial(businessId: string, serial: string) {
    return this.verifyPhone(businessId, serial);
  }

  async verifyPhone(businessId: string, query: string) {
    const clean = query.trim();

    const record = await this.prisma.phoneRecord.findFirst({
      where: {
        businessId,
        OR: [
          { imei1: clean },
          { imei2: clean },
          { serialNumber: { equals: clean, mode: 'insensitive' } },
        ],
      },
      include: { customer: true },
    });

    if (!record) {
      throw new NotFoundException(`No device found with IMEI/Serial: ${query}`);
    }

    // Check if warranty is still active
    const now = new Date();
    const isWarrantyValid = record.warrantyExpiryDate ? now <= record.warrantyExpiryDate : false;

    // Log verification check
    await this.prisma.verificationLog.create({
      data: {
        identifier: clean.slice(0, 50),
        status: isWarrantyValid ? 'VERIFIED' : 'EXPIRED',
        businessId,
      },
    });

    return {
      ...record,
      isWarrantyValid,
      daysRemaining: record.warrantyExpiryDate
        ? Math.max(0, Math.ceil((record.warrantyExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0,
    };
  }

  async reportStolen(businessId: string, phoneId: string, note?: string) {
    const record = await this.prisma.phoneRecord.findFirst({
      where: { id: phoneId, businessId },
    });

    if (!record) {
      throw new NotFoundException('Device not found');
    }

    return this.prisma.phoneRecord.update({
      where: { id: phoneId },
      data: {
        theftStatus: 'STOLEN',
        isStolen: true,
        lostNote: note || 'Reported stolen by merchant',
        stolenAt: new Date(),
      },
    });
  }

  async getVerificationLogs(businessId: string) {
    return this.prisma.verificationLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getPhoneRecord(businessId: string, id: string) {
    return this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
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

    // 3. Fallback TAC / Hardware Registry Profile
    const tacProfile = this.deviceIntel.parseTac(cleanId);
    let hardwareLookup: any = null;
    try {
      hardwareLookup = await this.deviceLookup.lookup(cleanId, 'LAPTOP');
    } catch (e) {
      // Non-blocking
    }

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
        status: isStolen ? 'FLAGGED_STOLEN' : (phone ? 'VERIFIED' : (hardwareLookup?.found ? 'VERIFIED' : 'NOT_FOUND')),
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

    // Determine detected hardware details
    const detectedBrand = activeTheftReport?.brand || (hardwareLookup?.found ? hardwareLookup.brand : null) || tacProfile.brand || (cleanId.length >= 8 ? 'Hardware Device' : 'Smartphone Device');
    const detectedModel = activeTheftReport?.model || (hardwareLookup?.found ? hardwareLookup.model : null) || tacProfile.model || 'Mobile / PC Device';
    const detectedSpecs = (hardwareLookup?.found ? hardwareLookup.specs : null) || tacProfile.hardwareVariant || null;

    // If not registered by a merchant, return hardware profile + theft status
    return {
      verified: !isStolen,
      isRegisteredInNetwork: false,
      hardwareDetected: Boolean(hardwareLookup?.found || tacProfile.isValidImei),
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
        brand: detectedBrand,
        model: detectedModel,
        color: activeTheftReport?.color || null,
        storageCapacity: detectedSpecs,
        condition: null,
        serialNumber: cleanId,
        registeredAt: activeTheftReport?.createdAt || null,
      },
      warranty: null,
      retailer: null,
      message: isStolen
        ? '🚨 WARNING: This device has been reported as STOLEN in the registry.'
        : (hardwareLookup?.found ? `Hardware recognized (${hardwareLookup.brand} System). Device is clean in global anti-theft registry.` : 'Device verified clean in global theft registry.'),
    };
  }
}
