import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminErrorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getErrorLogs(query: {
    search?: string;
    statusCode?: number;
    errorType?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = Math.min(Number(query.limit) || 50, 200);
    const page = Math.max(Number(query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.statusCode) {
      where.statusCode = Number(query.statusCode);
    }

    if (query.errorType) {
      where.errorType = { contains: query.errorType.trim(), mode: 'insensitive' };
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { endpoint: { contains: s, mode: 'insensitive' } },
        { errorType: { contains: s, mode: 'insensitive' } },
        { message: { contains: s, mode: 'insensitive' } },
        { userEmail: { contains: s, mode: 'insensitive' } },
        { stack: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [logs, totalCount, total500s, total400s] = await Promise.all([
      this.prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.errorLog.count({ where }),
      this.prisma.errorLog.count({ where: { statusCode: { gte: 500 } } }),
      this.prisma.errorLog.count({ where: { statusCode: { gte: 400, lt: 500 } } }),
    ]);

    return {
      logs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      stats: {
        totalErrors: totalCount,
        serverErrors500: total500s,
        clientErrors400: total400s,
      },
    };
  }

  async getErrorById(id: string) {
    const log = await this.prisma.errorLog.findUnique({
      where: { id },
    });
    if (!log) {
      throw new NotFoundException('Error log entry not found.');
    }
    return log;
  }

  async deleteError(id: string) {
    await this.prisma.errorLog.delete({
      where: { id },
    }).catch(() => null);
    return { success: true, message: 'Log deleted.' };
  }

  async clearAllLogs() {
    await this.prisma.errorLog.deleteMany({});
    return { success: true, message: 'All error logs cleared.' };
  }
}
