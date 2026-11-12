import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTheftReportDto } from './dto/create-theft-report.dto';
import { VerifiedReporter } from './reporter.guard';

/** 08012345678 -> 080******78. Enough to recognise your own number, not enough to call it. */
export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const clean = String(phone).trim();
  if (clean.length <= 5) return '*'.repeat(clean.length);
  return `${clean.slice(0, 3)}${'*'.repeat(clean.length - 5)}${clean.slice(-2)}`;
}

@Injectable()
export class TheftReportsService {
  constructor(private prisma: PrismaService) {}

  /** What an anonymous member of the public may see about a report. */
  toPublicReport(report: any) {
    return {
      id: report.id,
      brand: report.brand,
      model: report.model,
      color: report.color,
      status: report.status,
      lostNote: report.lostNote,
      bountyAmount: report.bountyAmount,
      ownerPhoneMasked: maskPhone(report.ownerPhone),
      reportedAt: report.createdAt,
    };
  }

  async createReport(dto: CreateTheftReportDto, reporter: VerifiedReporter) {
    const ownerEmail = reporter.email;
    const ownerName = dto.ownerName?.trim() || reporter.name;
    // Empty when the device has no IMEI (laptop, Wi-Fi tablet); never matched on.
    const cleanImei1 = (dto.imei1 || '').trim();
    const cleanImei2 = dto.imei2?.trim() || null;
    const cleanSerial = dto.serialNumber?.trim() || null;

    if (!cleanImei1 && !cleanSerial) {
      throw new BadRequestException('Enter the IMEI, or the serial number if the device has no IMEI.');
    }

    // Check if an ACTIVE theft report already exists for this identifier
    const existingActive = await this.prisma.theftReport.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          ...(cleanImei1 ? [{ imei1: cleanImei1 }] : []),
          ...(cleanImei2 ? [{ imei2: cleanImei2 }] : []),
          ...(cleanSerial ? [{ serialNumber: cleanSerial }] : []),
        ],
      },
    });

    if (existingActive) {
      // If same owner, return existing report
      if (existingActive.ownerEmail.toLowerCase() === ownerEmail) {
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
        ownerEmail,
        ownerName,
        ownerPhone: dto.ownerPhone.trim(),
        lostNote: dto.lostNote?.trim() || null,
        bountyAmount: dto.bountyAmount || 0,
        // Set by the server from how the reporter proved who they are.
        verificationSource: reporter.source,
        proofUrl: dto.proofUrl || null,
        policeCaseNo: dto.policeCaseNo?.trim() || null,
        status: 'ACTIVE',
      },
    });

    // If matching PhoneRecords exist in business inventory, sync the stolen flag
    await this.prisma.phoneRecord.updateMany({
      where: {
        OR: [
          ...(cleanImei1 ? [{ imei1: cleanImei1 }] : []),
          ...(cleanImei2 ? [{ imei2: cleanImei2 }] : []),
          ...(cleanSerial ? [{ serialNumber: cleanSerial }] : []),
        ],
      },
      data: {
        isStolen: true,
        theftStatus: 'STOLEN',
        stolenAt: new Date(),
        theftReason: 'Reported lost/stolen by owner via Public Registry',
        theftReportedBy: 'Device owner (verified)',
        lostNote: dto.lostNote?.trim() || null,
        contactPhone: dto.ownerPhone.trim(),
      },
    }).catch((err) => {
      console.warn('Syncing theft flag to PhoneRecords encountered non-fatal error:', err);
    });

    return report;
  }

  async resolveReport(reportId: string, reporter: VerifiedReporter, resolvedNote?: string) {
    const report = await this.prisma.theftReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Theft report not found');
    }

    if (report.ownerEmail.toLowerCase() !== reporter.email) {
      throw new ForbiddenException('Only the original verified reporter can mark this device as recovered.');
    }

    if (report.status === 'RESOLVED') {
      return report;
    }

    const updated = await this.prisma.theftReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedNote: resolvedNote?.trim() || 'Marked as recovered by owner',
      },
    });

    // Clear stolen flag on matching PhoneRecords if no other ACTIVE reports exist
    const otherActiveReports = await this.prisma.theftReport.findFirst({
      where: {
        id: { not: reportId },
        status: 'ACTIVE',
        OR: [
          ...(report.imei1 ? [{ imei1: report.imei1 }] : []),
          ...(report.imei2 ? [{ imei2: report.imei2 }] : []),
          ...(report.serialNumber ? [{ serialNumber: report.serialNumber }] : []),
        ],
      },
    });

    if (!otherActiveReports) {
      await this.prisma.phoneRecord.updateMany({
        where: {
          OR: [
            ...(report.imei1 ? [{ imei1: report.imei1 }] : []),
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
    if (!cleanId) return null;
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
