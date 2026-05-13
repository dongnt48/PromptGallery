import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalPrompts,
      totalLikes,
      totalBookmarks,
      totalTags,
      newUsersToday,
      newPromptsToday,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isDelete: false } }),
      this.prisma.prompt.count({ where: { isDelete: false } }),
      this.prisma.like.count(),
      this.prisma.bookmark.count(),
      this.prisma.tag.count(),
      this.prisma.user.count({
        where: { isDelete: false, createdAt: { gte: todayStart } },
      }),
      this.prisma.prompt.count({
        where: { isDelete: false, createdAt: { gte: todayStart } },
      }),
    ]);

    // Chart data: prompts created per day for the last 7 days
    const chartData: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const count = await this.prisma.prompt.count({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      });
      const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      chartData.push({ label: dayLabel, value: count });
    }

    return {
      totalUsers,
      totalPrompts,
      totalLikes,
      totalBookmarks,
      totalTags,
      newUsersToday,
      newPromptsToday,
      chartData,
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isDelete: true,
          createdAt: true,
          _count: {
            select: {
              prompts: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(id: bigint, data: { role?: string; isDelete?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isDelete: true,
      },
    });
  }

  async bulkUpdateUsers(ids: bigint[], data: { isDelete?: boolean }) {
    return this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  async getPrompts(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          images: {
            take: 1,
            orderBy: { isCover: 'desc' },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.prompt.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePrompt(id: bigint, data: { isPublic?: boolean; isDelete?: boolean }) {
    return this.prisma.prompt.update({
      where: { id },
      data,
    });
  }

  async bulkUpdatePrompts(ids: bigint[], data: { isDelete?: boolean; isPublic?: boolean }) {
    return this.prisma.prompt.updateMany({
      where: { id: { in: ids } },
      data,
    });
  }

  async deletePromptPermanently(id: bigint) {
    return this.prisma.prompt.delete({
      where: { id },
    });
  }

  async bulkDeletePromptsPermanently(ids: bigint[]) {
    return this.prisma.prompt.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
