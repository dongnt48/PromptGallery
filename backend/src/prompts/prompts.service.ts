import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface JobData {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  promptId?: string;
  message: string;
  createdAt: Date;
}

@Injectable()
export class PromptsService {
  private jobQueue: Map<string, JobData> = new Map();

  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, userId?: bigint, authorId?: bigint, tagSlugs?: string[], aiModel?: string, searchKeyword?: string) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereClause: any = {
      isDelete: false,
      ...(authorId ? { userId: authorId } : {}),
      ...(aiModel ? { aiModel } : {}),
    };

    if (searchKeyword && searchKeyword.trim() !== '') {
      whereClause.content = {
        contains: searchKeyword.trim()
      };
    }

    if (tagSlugs && tagSlugs.length > 0) {
      whereClause.tags = {
        some: {
          tag: {
            slug: { in: tagSlugs },
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where: whereClause,
        skip,
        take,
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
            orderBy: { isCover: 'desc' },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
            },
          },
          likes: userId ? { where: { userId } } : false,
          bookmarks: userId ? { where: { userId } } : false,
        },
      }),
      this.prisma.prompt.count({
        where: whereClause,
      }),
    ]);

    const formattedData = items.map(item => ({
      ...item,
      likesCount: item._count.likes,
      bookmarksCount: item._count.bookmarks,
      isLiked: userId ? item.likes.length > 0 : false,
      isBookmarked: userId ? item.bookmarks.length > 0 : false,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async findOne(id: bigint, userId?: bigint) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id, isDelete: false },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            bio: true,
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
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!prompt) return null;

    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const [like, bookmark] = await Promise.all([
        this.prisma.like.findUnique({
          where: { userId_promptId: { userId, promptId: id } },
        }),
        this.prisma.bookmark.findUnique({
          where: { userId_promptId: { userId, promptId: id } },
        }),
      ]);
      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    return {
      ...prompt,
      likesCount: prompt._count.likes,
      bookmarksCount: prompt._count.bookmarks,
      isLiked,
      isBookmarked,
    };
  }

  async findBookmarks(page: number = 1, limit: number = 10, userId: bigint, searchKeyword?: string) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereClause: any = { userId, prompt: { isDelete: false } };

    if (searchKeyword && searchKeyword.trim() !== '') {
      whereClause.prompt = {
        ...whereClause.prompt,
        content: {
          contains: searchKeyword.trim()
        }
      };
    }

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          prompt: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
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
              _count: {
                select: {
                  likes: true,
                  bookmarks: true,
                },
              },
              likes: { where: { userId } },
              bookmarks: { where: { userId } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bookmark.count({
        where: whereClause,
      }),
    ]);

    const formattedData = bookmarks.map(b => ({
      ...b.prompt,
      likesCount: b.prompt._count.likes,
      bookmarksCount: b.prompt._count.bookmarks,
      isLiked: b.prompt.likes.length > 0,
      isBookmarked: true,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async toggleLike(userId: bigint, promptId: bigint) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_promptId: { userId, promptId } },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { userId_promptId: { userId, promptId } },
      });
      return { liked: false };
    } else {
      await this.prisma.like.create({
        data: { userId, promptId },
      });
      return { liked: true };
    }
  }

  async toggleBookmark(userId: bigint, promptId: bigint) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_promptId: { userId, promptId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: { userId_promptId: { userId, promptId } },
      });
      return { bookmarked: false };
    } else {
      await this.prisma.bookmark.create({
        data: { userId, promptId },
      });
      return { bookmarked: true };
    }
  }

  async deletePrompt(userId: bigint, promptId: bigint) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    if (prompt.userId !== userId) {
      throw new Error('You can only delete your own prompts');
    }

    // Soft delete by setting isDelete to true
    return this.prisma.prompt.update({
      where: { id: promptId },
      data: { isDelete: true },
    });
  }

  async updatePrompt(
    userId: bigint,
    promptId: bigint,
    data: {
      content?: string;
      aiModel?: string;
      isPublic?: boolean;
      tags?: string[];
      negativePrompt?: string;
      source?: string;
      type?: string;
    },
  ) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    if (prompt.userId !== userId) {
      throw new Error('You can only edit your own prompts');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedPrompt = await tx.prompt.update({
        where: { id: promptId },
        data: {
          content: data.content,
          aiModel: data.aiModel,
          isPublic: data.isPublic,
          negativePrompt: data.negativePrompt,
          source: data.source,
          type: data.type,
        },
      });

      // 2. Update tags if provided
      if (data.tags) {
        // Remove old tags
        await tx.promptTag.deleteMany({
          where: { promptId },
        });

        // Add new tags
        for (const tagName of data.tags) {
          const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const tag = await tx.tag.upsert({
            where: { slug },
            update: {},
            create: { name: tagName, slug },
          });

          await tx.promptTag.create({
            data: { promptId, tagId: tag.id },
          });
        }
      }

      return updatedPrompt;
    });
  }

  /**
   * Queue-based prompt creation.
   * Returns a jobId immediately and processes the prompt in the background.
   */
  async createPromptQueued(
    userId: bigint,
    body: {
      content: string;
      aiModel: string;
      isPublic: boolean;
      tags: string[];
      negativePrompt?: string;
      source?: string;
      type?: string;
    },
    files: Express.Multer.File[],
  ) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.jobQueue.set(jobId, {
      status: 'queued',
      message: 'Your prompt is being created...',
      createdAt: new Date(),
    });

    // Process asynchronously
    this.processCreatePrompt(jobId, userId, body, files);

    return { jobId, status: 'queued', message: 'Your prompt is being created...' };
  }

  private async processCreatePrompt(
    jobId: string,
    userId: bigint,
    body: {
      content: string;
      aiModel: string;
      isPublic: boolean;
      tags: string[];
      negativePrompt?: string;
      source?: string;
      type?: string;
    },
    files: Express.Multer.File[],
  ) {
    try {
      this.jobQueue.set(jobId, {
        status: 'processing',
        message: 'Processing your prompt...',
        createdAt: this.jobQueue.get(jobId)!.createdAt,
      });

      // Simulate slight processing delay for queue realism
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create prompt with images and tags in a transaction
      const prompt = await this.prisma.$transaction(async (tx) => {
        // 1. Create the prompt
        const newPrompt = await tx.prompt.create({
          data: {
            userId,
            content: body.content,
            aiModel: body.aiModel,
            isPublic: body.isPublic,
            negativePrompt: body.negativePrompt || null,
            source: body.source || null,
            type: body.type || null,
          },
        });

        // 2. Create images — first image is cover
        if (files && files.length > 0) {
          const imageData = files.map((file, index) => ({
            promptId: newPrompt.id,
            imageUrl: `/uploads/${file.filename}`,
            isCover: index === 0,
          }));

          await tx.image.createMany({ data: imageData });
        }

        // 3. Process tags
        if (body.tags && body.tags.length > 0) {
          for (const tagName of body.tags) {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            // Upsert tag
            const tag = await tx.tag.upsert({
              where: { slug },
              update: {},
              create: { name: tagName, slug },
            });

            // Connect tag to prompt
            await tx.promptTag.create({
              data: { promptId: newPrompt.id, tagId: tag.id },
            });
          }
        }

        return newPrompt;
      });

      this.jobQueue.set(jobId, {
        status: 'completed',
        promptId: prompt.id.toString(),
        message: 'Prompt created successfully!',
        createdAt: this.jobQueue.get(jobId)!.createdAt,
      });
    } catch (error) {
      console.error('Error creating prompt:', error);
      this.jobQueue.set(jobId, {
        status: 'failed',
        message: `Failed to create prompt: ${error.message || 'Unknown error'}`,
        createdAt: this.jobQueue.get(jobId)!.createdAt,
      });
    }
  }

  getJobStatus(jobId: string) {
    const job = this.jobQueue.get(jobId);
    if (!job) {
      return { status: 'not_found', message: 'Job not found' };
    }
    return job;
  }
}
