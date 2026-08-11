import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairTicketDto } from './dto/create-repair-ticket.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { RepairStatus } from '@prisma/client';

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string, query?: { search?: string; status?: RepairStatus }) {
    const where: any = { businessId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { issueDescription: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.repairTicket.findMany({
      where,
      include: {
        customer: true,
        phoneRecord: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const ticket = await this.prisma.repairTicket.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        phoneRecord: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Repair ticket with ID "${id}" not found.`);
    }

    return ticket;
  }

  async create(businessId: string, dto: CreateRepairTicketDto) {
    // 1. Find or create customer
    let customer = await this.prisma.customer.findFirst({
      where: {
        businessId,
        name: { equals: dto.customerName.trim(), mode: 'insensitive' },
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId,
          name: dto.customerName.trim(),
          phone: dto.customerPhone?.trim() || 'N/A',
        },
      });
    }

    // 2. Generate unique Ticket Number (REP-XXXXXX)
    const ref = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `REP-${ref}`;

    // 3. Create Repair Ticket
    return this.prisma.repairTicket.create({
      data: {
        ticketNumber,
        businessId,
        customerId: customer.id,
        phoneRecordId: dto.phoneRecordId || undefined,
        issueDescription: dto.issueDescription,
        estimatedCost: dto.estimatedCost || 0,
        status: dto.status || RepairStatus.DIAGNOSING,
        technicianNotes: dto.technicianNotes,
      },
      include: {
        customer: true,
        phoneRecord: true,
      },
    });
  }

  async updateStatus(businessId: string, id: string, dto: UpdateRepairStatusDto) {
    await this.findOne(businessId, id);

    const updateData: any = {
      status: dto.status,
    };

    if (dto.technicianNotes) {
      updateData.technicianNotes = dto.technicianNotes;
    }

    if (dto.finalCost !== undefined) {
      updateData.finalCost = dto.finalCost;
    }

    if (dto.status === RepairStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.repairTicket.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        phoneRecord: true,
      },
    });
  }
}
