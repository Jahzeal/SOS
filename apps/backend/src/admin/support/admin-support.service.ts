import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class AdminSupportService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; priority?: string; search?: string }) {
    const { status, priority, search } = query;

    const where: any = {};

    if (status && status !== 'ALL') {
      const enumStatus = status.toUpperCase().replace(/\s+/g, '_') as TicketStatus;
      if (Object.values(TicketStatus).includes(enumStatus)) {
        where.status = enumStatus;
      }
    }

    if (priority && priority !== 'ALL') {
      const enumPriority = priority.toUpperCase() as TicketPriority;
      if (Object.values(TicketPriority).includes(enumPriority)) {
        where.priority = enumPriority;
      }
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [tickets, totalCount, openCount, inProgressCount, resolvedCount] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              plan: true,
            },
          },
        },
      }),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } },
      }),
    ]);

    const formatted = tickets.map((t) => ({
      id: t.ticketNumber || t.id,
      businessId: t.businessId,
      businessName: t.business?.name || 'Unknown Store',
      businessPlan: t.business?.plan || 'STARTER',
      requesterName: t.requesterName,
      requesterEmail: t.requesterEmail,
      requesterPhone: t.requesterPhone || '',
      requesterRole: t.requesterRole || 'Staff',
      subject: t.subject,
      description: t.description,
      priority: t.priority,
      status: t.status,
      relatedImei: t.relatedImei,
      relatedSerial: t.relatedSerial,
      relatedVerificationId: t.relatedVerificationId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return {
      success: true,
      counts: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
      data: formatted,
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        business: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    return { success: true, data: ticket };
  }

  async updateStatus(id: string, newStatus: string) {
    const enumStatus = newStatus.toUpperCase().replace(/\s+/g, '_') as TicketStatus;

    const ticket = await this.prisma.supportTicket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: enumStatus },
    });

    return { success: true, data: updated };
  }

  async createTicket(dto: {
    businessId: string;
    requesterName: string;
    requesterEmail: string;
    subject: string;
    description: string;
    priority?: TicketPriority;
  }) {
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `VF-${1000 + count + 1}`;

    const created = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        businessId: dto.businessId,
        requesterName: dto.requesterName,
        requesterEmail: dto.requesterEmail,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || TicketPriority.NORMAL,
        status: TicketStatus.OPEN,
      },
    });

    return { success: true, data: created };
  }
}
