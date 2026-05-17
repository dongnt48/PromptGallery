import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getUserNotifications(userId: bigint) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    
    return notifications.map(n => ({
      ...n,
      id: n.id.toString(),
      userId: n.userId.toString(),
    }));
  }

  async markAllAsRead(userId: bigint) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async createNotification(userId: bigint, message: string, type: string = 'info') {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        message,
        type,
      },
    });
    return {
      ...notification,
      id: notification.id.toString(),
      userId: notification.userId.toString(),
    };
  }
}
