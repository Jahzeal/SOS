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
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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
}
