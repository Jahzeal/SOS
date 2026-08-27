import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class AdminBusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; plan?: string; page?: number; limit?: number }) {
    const { search, plan, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (plan && plan !== 'ALL') {
      where.plan = plan as Plan;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, businesses] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              phoneRecords: true,
              sales: true,
              repairs: true,
            },
          },
          users: {
            take: 2,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
      data: businesses,
    };
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            phoneRecords: true,
            sales: true,
            customers: true,
            repairs: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return { success: true, data: business };
  }

  async updatePlan(id: string, plan: Plan) {
    const business = await this.prisma.business.update({
      where: { id },
      data: { plan },
    });

    return { success: true, data: business };
  }

  async togglePublicVerification(id: string) {
    const current = await this.prisma.business.findUnique({
      where: { id },
      select: { publicVerificationEnabled: true },
    });

    if (!current) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    const updated = await this.prisma.business.update({
      where: { id },
      data: { publicVerificationEnabled: !current.publicVerificationEnabled },
    });

    return { success: true, data: updated };
  }

  async delete(id: string) {
    await this.prisma.business.delete({
      where: { id },
    });
    return { success: true, message: `Business ${id} successfully removed` };
  }
}
