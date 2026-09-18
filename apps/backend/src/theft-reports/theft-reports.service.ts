import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTheftReportDto, ResolveTheftReportDto } from './dto/create-theft-report.dto';

@Injectable()
export class TheftReportsService {
  constructor(private prisma: PrismaService) {}

  async createReport(dto: CreateTheftReportDto) {
    const cleanImei1 = dto.imei1.trim();
    const cleanImei2 = dto.imei2?.trim() || null;
    const cleanSerial = dto.serialNumber?.trim() || null;

    // Check if an ACTIVE theft report already exists for this identifier
    const existingActive = await this.prisma.theftReport.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { imei1: cleanImei1 },
          ...(cleanImei2 ? [{ imei2: cleanImei2 }] : []),
          ...(cleanSerial ? [{ serialNumber: cleanSerial }] : []),
        ],
      },
    });

    if (existingActive) {
      // If same owner, return existing report
      if (existingActive.ownerEmail.toLowerCase() === dto.ownerEmail.toLowerCase()) {
        return existingActive;
      }
      throw new ConflictException('This device is already actively reported as stolen in the registry.');
    }

    const report = await this.prisma.theftReport.create({
      data: {
        imei1: cleanImei1,
        imei2: cleanImei2,
        serialNumber: cleanSerial,
        brand: dto.brand.trim(),
        model: dto.model.trim(),
        color: dto.color?.trim() || null,
        ownerEmail: dto.ownerEmail.toLowerCase().trim(),
        ownerName: dto.ownerName.trim(),
        ownerPhone: dto.ownerPhone.trim(),
        lostNote: dto.lostNote?.trim() || null,
        bountyAmount: dto.bountyAmount || 0,
        verificationSource: dto.verificationSource || 'GOOGLE_AUTH',
        proofUrl: dto.proofUrl || null,
        policeCaseNo: dto.policeCaseNo?.trim() || null,
        status: 'ACTIVE',
      },
    });

    // If matching PhoneRecords exist in business inventory, sync the stolen flag
    await this.prisma.phoneRecord.updateMany({
      where: {
        OR: [
          { imei1: cleanImei1 },
          ...(cleanImei2 ? [{ imei2: cleanImei2 }] : []),
          ...(cleanSerial ? [{ serialNumber: cleanSerial }] : []),
        ],
      },
      data: {
        isStolen: true,
        theftStatus: 'STOLEN',
        stolenAt: new Date(),
        theftReason: 'Reported lost/stolen by owner via Public Registry',
        theftReportedBy: dto.ownerEmail.toLowerCase().trim(),
        lostNote: dto.lostNote?.trim() || null,
        contactPhone: dto.ownerPhone.trim(),
      },
    }).catch((err) => {
      console.warn('Syncing theft flag to PhoneRecords encountered non-fatal error:', err);
    });

    return report;
  }

  async resolveReport(reportId: string, dto: ResolveTheftReportDto) {
    const report = await this.prisma.theftReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Theft report not found');
    }

    if (report.ownerEmail.toLowerCase() !== dto.ownerEmail.toLowerCase().trim()) {
      throw new UnauthorizedException('Only the original verified reporter can mark this device as recovered.');
    }

    const updated = await this.prisma.theftReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedNote: dto.resolvedNote?.trim() || 'Marked as recovered by owner',
      },
    });

    // Clear stolen flag on matching PhoneRecords if no other ACTIVE reports exist
    const otherActiveReports = await this.prisma.theftReport.findFirst({
      where: {
        id: { not: reportId },
        status: 'ACTIVE',
        OR: [
          { imei1: report.imei1 },
          ...(report.imei2 ? [{ imei2: report.imei2 }] : []),
          ...(report.serialNumber ? [{ serialNumber: report.serialNumber }] : []),
        ],
      },
    });

    if (!otherActiveReports) {
      await this.prisma.phoneRecord.updateMany({
        where: {
          OR: [
            { imei1: report.imei1 },
            ...(report.imei2 ? [{ imei2: report.imei2 }] : []),
            ...(report.serialNumber ? [{ serialNumber: report.serialNumber }] : []),
          ],
        },
        data: {
          isStolen: false,
          theftStatus: 'CLEAN',
          stolenAt: null,
          theftReason: null,
          theftReportedBy: null,
          lostNote: null,
        },
      }).catch((err) => {
        console.warn('Clearing theft flag on PhoneRecords encountered non-fatal error:', err);
      });
    }

    return updated;
  }

  async getUserReports(ownerEmail: string) {
    if (!ownerEmail) return [];
    return this.prisma.theftReport.findMany({
      where: {
        ownerEmail: ownerEmail.toLowerCase().trim(),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveReportByIdentifier(identifier: string) {
    const cleanId = identifier.trim();
    return this.prisma.theftReport.findFirst({
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
  }
}
