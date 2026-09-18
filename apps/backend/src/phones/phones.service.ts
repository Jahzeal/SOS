import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { PhoneStatus } from '@prisma/client';
import * as QRCode from 'qrcode';

@Injectable()
export class PhonesService {
  constructor(private prisma: PrismaService) {}

  async checkImei(businessId: string, imei: string) {
    const cleanImei = imei.trim();
    const existing = await this.prisma.phoneRecord.findFirst({
      where: {
        businessId,
        OR: [
          { imei1: cleanImei },
          { imei2: cleanImei },
          { serialNumber: cleanImei },
        ],
      },
      include: {
        customer: true,
        business: {
          select: { name: true },
        },
      },
    });

    if (existing) {
      return {
        exists: true,
        record: existing,
        message: `IMEI ${cleanImei} is already registered under ${existing.brand} ${existing.model}.`,
      };
    }

    return {
      exists: false,
      record: null,
      message: `IMEI ${cleanImei} is available for registration.`,
    };
  }

  async registerPhone(businessId: string, userId: string, dto: RegisterPhoneDto) {
    // 1. Check duplicate IMEI
    const imeiCheck = await this.checkImei(businessId, dto.imei1);
    if (imeiCheck.exists) {
      throw new ConflictException(imeiCheck.message);
    }

    // 2. Customer Assignment if provided
    let customerId: string | undefined = undefined;
    if (dto.customerName && dto.customerPhone) {
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
            name: dto.customerName.trim(),
            phone: dto.customerPhone.trim(),
            email: dto.customerEmail?.trim(),
          },
        });
      }
      customerId = customer.id;
    }

    // 3. Compute Warranty Expiry Date
    const warrantyMonths = dto.warrantyDurationMonths ?? 0;
    const warrantyExpiryDate = warrantyMonths > 0
      ? new Date(new Date().setMonth(new Date().getMonth() + warrantyMonths))
      : null;

    // 4. Create Phone Record
    const phoneRecord = await this.prisma.phoneRecord.create({
      data: {
        businessId,
        imei1: dto.imei1.trim(),
        imei2: dto.imei2?.trim(),
        serialNumber: dto.serialNumber?.trim(),
        brand: dto.brand.trim(),
        model: dto.model.trim(),
        color: dto.color?.trim(),
        storageCapacity: dto.storageCapacity?.trim(),
        condition: dto.condition,
        status: PhoneStatus.IN_STOCK,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        carrierStatus: dto.carrierStatus || undefined,
        lockedCarrier: dto.lockedCarrier?.trim() || null,
        activationStatus: dto.activationStatus || undefined,
        warrantyDurationMonths: warrantyMonths,
        warrantyExpiryDate,
        registeredById: userId,
        customerId,
      },
      include: {
        customer: true,
        business: {
          select: { name: true, slug: true },
        },
      },
    });

    // 5. Generate Verification QR Data URL
    const verificationUrl = `https://verifyflow.com/verify?imei=${phoneRecord.imei1}`;
    const qrCodeUrl = await QRCode.toDataURL(verificationUrl);

    // Save QR Code URL back to record
    const updatedRecord = await this.prisma.phoneRecord.update({
      where: { id: phoneRecord.id },
      data: { qrCodeUrl },
      include: {
        customer: true,
        business: true,
      },
    });

    return updatedRecord;
  }

  async findAll(businessId: string, query?: { search?: string; status?: PhoneStatus; brand?: string }) {
    const where: any = { businessId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.brand) {
      where.brand = { equals: query.brand, mode: 'insensitive' };
    }

    if (query?.search) {
      const search = query.search.trim();
      where.OR = [
        { imei1: { contains: search, mode: 'insensitive' } },
        { imei2: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.phoneRecord.findMany({
      where,
      select: {
        id: true,
        brand: true,
        model: true,
        color: true,
        storageCapacity: true,
        imei1: true,
        imei2: true,
        serialNumber: true,
        condition: true,
        status: true,
        purchasePrice: true,
        sellingPrice: true,
        carrierStatus: true,
        lockedCarrier: true,
        activationStatus: true,
        isStolen: true,
        theftStatus: true,
        stolenAt: true,
        theftReason: true,
        lostNote: true,
        contactPhone: true,
        warrantyDurationMonths: true,
        warrantyExpiryDate: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async flagAsStolen(businessId: string, id: string, dto: any) {
    const phone = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
      include: { business: true },
    });

    if (!phone) {
      throw new NotFoundException('Phone record not found');
    }

    const updated = await this.prisma.phoneRecord.update({
      where: { id },
      data: {
        isStolen: true,
        theftStatus: 'STOLEN',
        stolenAt: new Date(),
        theftReason: dto.theftReason?.trim() || 'Reported stolen from business inventory',
        theftReportedBy: phone.business.name,
        lostNote: dto.lostNote?.trim() || null,
        contactPhone: dto.contactPhone?.trim() || phone.business.phone || null,
      },
    });

    // Create an active TheftReport in the global registry
    await this.prisma.theftReport.create({
      data: {
        imei1: phone.imei1,
        imei2: phone.imei2,
        serialNumber: phone.serialNumber,
        brand: phone.brand,
        model: phone.model,
        color: phone.color,
        ownerEmail: phone.business.email || 'business@verifyflow.com',
        ownerName: phone.business.name,
        ownerPhone: dto.contactPhone?.trim() || phone.business.phone || 'N/A',
        lostNote: dto.lostNote?.trim() || dto.theftReason?.trim() || `Reported stolen by retailer ${phone.business.name}`,
        verificationSource: 'BUSINESS_VERIFIED',
        policeCaseNo: dto.policeCaseNo?.trim() || null,
        status: 'ACTIVE',
      },
    }).catch(() => {});

    return updated;
  }

  async clearStolenFlag(businessId: string, id: string) {
    const phone = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
    });

    if (!phone) {
      throw new NotFoundException('Phone record not found');
    }

    const updated = await this.prisma.phoneRecord.update({
      where: { id },
      data: {
        isStolen: false,
        theftStatus: 'CLEAN',
        stolenAt: null,
        theftReason: null,
        theftReportedBy: null,
        lostNote: null,
        contactPhone: null,
      },
    });

    // Resolve any active theft reports for this IMEI
    await this.prisma.theftReport.updateMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { imei1: phone.imei1 },
          ...(phone.imei2 ? [{ imei2: phone.imei2 }] : []),
          ...(phone.serialNumber ? [{ serialNumber: phone.serialNumber }] : []),
        ],
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedNote: 'Cleared by verified retailer',
      },
    }).catch(() => {});

    return updated;
  }


  async findOne(businessId: string, id: string) {
    const record = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        business: true,
        repairs: true,
        saleItems: {
          include: {
            sale: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Phone record with ID ${id} not found.`);
    }

    return record;
  }

  async update(businessId: string, id: string, dto: any) {
    const record = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
    });

    if (!record) {
      throw new NotFoundException(`Phone record with ID ${id} not found.`);
    }

    // Customer assignment / update if customer details provided
    let customerId = record.customerId;
    if (dto.customerName && dto.customerPhone) {
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
            name: dto.customerName.trim(),
            phone: dto.customerPhone.trim(),
            email: dto.customerEmail?.trim(),
          },
        });
      } else {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: dto.customerName.trim(),
            email: dto.customerEmail?.trim() || customer.email,
          },
        });
      }
      customerId = customer.id;
    }

    const updateData: any = {};
    if (dto.brand !== undefined) updateData.brand = dto.brand.trim();
    if (dto.model !== undefined) updateData.model = dto.model.trim();
    if (dto.color !== undefined) updateData.color = dto.color?.trim();
    if (dto.storageCapacity !== undefined) updateData.storageCapacity = dto.storageCapacity?.trim();
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.purchasePrice !== undefined) updateData.purchasePrice = Number(dto.purchasePrice) || 0;
    if (dto.sellingPrice !== undefined) updateData.sellingPrice = Number(dto.sellingPrice) || 0;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber?.trim();
    if (dto.imei2 !== undefined) updateData.imei2 = dto.imei2?.trim();

    if (dto.warrantyDurationMonths !== undefined) {
      const warrantyMonths = Number(dto.warrantyDurationMonths) || 0;
      updateData.warrantyDurationMonths = warrantyMonths;
      if (warrantyMonths > 0) {
        const baseDate = record.createdAt ? new Date(record.createdAt) : new Date();
        updateData.warrantyExpiryDate = new Date(new Date(baseDate).setMonth(baseDate.getMonth() + warrantyMonths));
      } else {
        updateData.warrantyExpiryDate = null;
      }
    }

    if (customerId) {
      updateData.customerId = customerId;
    }

    return this.prisma.phoneRecord.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        business: true,
        repairs: true,
        saleItems: {
          include: {
            sale: true,
          },
        },
      },
    });
  }

  async delete(businessId: string, id: string) {
    const record = await this.prisma.phoneRecord.findFirst({
      where: { id, businessId },
    });

    if (!record) {
      throw new NotFoundException(`Phone record with ID ${id} not found.`);
    }

    await this.prisma.phoneRecord.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Phone record ${record.brand} ${record.model} (${record.imei1}) deleted successfully.`,
    };
  }
}
