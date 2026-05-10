import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromptsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        images: {
          orderBy: { isCover: 'desc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }
}
