import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminBusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { search?: string; plan?: string; page?: number; limit?: number }) {
    const pageNum = Math.max(1, Number(query.page) || 1);
    const limitNum = Math.max(1, Number(query.limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (query.plan && query.plan !== 'ALL') {
      where.plan = query.plan;
    }
    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { users: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [total, businesses] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        skip,
        take: limitNum,
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
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      businesses,
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

  async updatePlan(id: string, plan: string) {
    const cleanPlan = (plan || 'STARTER').toUpperCase();
    const business = await this.prisma.business.update({
      where: { id },
      data: { plan: cleanPlan },
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

  /**
   * Total delete: the store and everything in it, plus every login on it (owner and
   * staff), so the same emails can sign up again. NoxGuarda admin logins are never touched.
   * If it was a marketer's demo store, the marketer record goes too.
   */
  async delete(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!business) throw new NotFoundException('Business not found.');
    await this.prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ where: { businessId: id, role: { not: 'ADMIN' } }, select: { id: true } });
      await tx.marketer.deleteMany({ where: { businessId: id } });
      await tx.business.delete({ where: { id } });
      if (users.length) await tx.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    });
    return { success: true, message: `${business.name} was deleted.` };
  }
}
