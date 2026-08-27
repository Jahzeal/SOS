import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  monthlyPriceNgn: number;
  annualPriceNgn?: number;
  maxDevices?: number;
  customBranding?: boolean;
  prioritySupport?: boolean;
  features?: string[];
  isActive?: boolean;
  isPublic?: boolean;
  sortOrder?: number;
}

@Injectable()
export class AdminPlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    });

    return {
      success: true,
      plans: plans.map((p) => ({
        ...p,
        subscribersCount: p._count.businesses,
      })),
    };
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return { success: true, plan };
  }

  async create(dto: CreatePlanDto) {
    if (!dto.code || !dto.name) {
      throw new BadRequestException('Plan code and name are required');
    }

    const cleanCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new ConflictException(`A plan with code "${cleanCode}" already exists.`);
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        code: cleanCode,
        name: dto.name.trim(),
        description: dto.description || '',
        monthlyPriceNgn: Number(dto.monthlyPriceNgn) || 0,
        annualPriceNgn: Number(dto.annualPriceNgn) || (Number(dto.monthlyPriceNgn) || 0) * 10,
        maxDevices: Number(dto.maxDevices) || 100,
        customBranding: Boolean(dto.customBranding),
        prioritySupport: Boolean(dto.prioritySupport),
        features: dto.features || [],
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
        sortOrder: Number(dto.sortOrder) || 10,
      },
    });

    return {
      success: true,
      message: `Plan "${plan.name}" created successfully.`,
      plan,
    };
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.monthlyPriceNgn !== undefined) data.monthlyPriceNgn = Number(dto.monthlyPriceNgn);
    if (dto.annualPriceNgn !== undefined) data.annualPriceNgn = Number(dto.annualPriceNgn);
    if (dto.maxDevices !== undefined) data.maxDevices = Number(dto.maxDevices);
    if (dto.customBranding !== undefined) data.customBranding = Boolean(dto.customBranding);
    if (dto.prioritySupport !== undefined) data.prioritySupport = Boolean(dto.prioritySupport);
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.isActive !== undefined) data.isActive = Boolean(dto.isActive);
    if (dto.isPublic !== undefined) data.isPublic = Boolean(dto.isPublic);
    if (dto.sortOrder !== undefined) data.sortOrder = Number(dto.sortOrder);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: `Plan "${updated.name}" updated successfully.`,
      plan: updated,
    };
  }

  async delete(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { businesses: true } } },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    if (plan._count.businesses > 0) {
      await this.prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false, isPublic: false },
      });
      return {
        success: true,
        message: `Plan "${plan.name}" has ${plan._count.businesses} active subscriber(s) and was deactivated.`,
      };
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return {
      success: true,
      message: `Plan "${plan.name}" permanently deleted.`,
    };
  }
}
