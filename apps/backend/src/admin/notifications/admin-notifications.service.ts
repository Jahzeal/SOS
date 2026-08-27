import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationCategory, NotificationPriority } from '@prisma/client';

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { category?: string; status?: 'all' | 'unread' | 'read'; search?: string }) {
    const { category, status, search } = query;

    const where: any = {};

    if (category && category !== 'all') {
      const enumCat = category.toUpperCase() as NotificationCategory;
      if (Object.values(NotificationCategory).includes(enumCat)) {
        where.category = enumCat;
      }
    }

    if (status === 'unread') {
      where.isRead = false;
    } else if (status === 'read') {
      where.isRead = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminNotification.count({ where }),
      this.prisma.adminNotification.count({ where: { isRead: false } }),
    ]);

    return {
      success: true,
      unreadCount,
      total,
      data: notifications,
    };
  }

  async markAsRead(id: string) {
    const item = await this.prisma.adminNotification.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    const updated = await this.prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return { success: true, data: updated };
  }

  async markAllAsRead() {
    await this.prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  async delete(id: string) {
    await this.prisma.adminNotification.delete({
      where: { id },
    });

    return { success: true, message: `Notification ${id} removed` };
  }

  async create(dto: {
    title: string;
    message: string;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionLabel?: string;
    meta?: any;
  }) {
    const created = await this.prisma.adminNotification.create({
      data: {
        title: dto.title,
        message: dto.message,
        category: dto.category || NotificationCategory.SYSTEM,
        priority: dto.priority || NotificationPriority.NORMAL,
        actionUrl: dto.actionUrl,
        actionLabel: dto.actionLabel,
        meta: dto.meta,
      },
    });

    return { success: true, data: created };
  }
}
