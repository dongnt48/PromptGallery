import { Test, TestingModule } from '@nestjs/testing';
import { PromptsService } from './prompts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PromptsService', () => {
  let service: PromptsService;
  let findManySpy: jest.SpyInstance;
  let findUniqueSpy: jest.SpyInstance;

  const mockPrismaService = {
    prompt: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
    },
    bookmark: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    like: {
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
    findManySpy = jest.spyOn(mockPrismaService.prompt, 'findMany');
    findUniqueSpy = jest.spyOn(mockPrismaService.prompt, 'findUnique');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query only public prompts if authorId is not specified (Explore page)', async () => {
      await service.findAll(1, 10, undefined, undefined);

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDelete: false,
            isPublic: true,
          }),
        }),
      );
    });

    it('should query only public prompts if authorId differs from userId', async () => {
      await service.findAll(1, 10, BigInt(1), BigInt(2));

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDelete: false,
            isPublic: true,
            userId: BigInt(2),
          }),
        }),
      );
    });

    it('should query all prompts (including private) if authorId matches userId', async () => {
      await service.findAll(1, 10, BigInt(1), BigInt(1));

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isDelete: false,
            userId: BigInt(1),
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockPrompt = {
      id: BigInt(1),
      userId: BigInt(100),
      isPublic: false,
      _count: { likes: 0, bookmarks: 0 },
    };

    it('should return null if prompt does not exist', async () => {
      findUniqueSpy.mockResolvedValue(null);
      const result = await service.findOne(BigInt(1), BigInt(100));
      expect(result).toBeNull();
    });

    it('should return prompt if it is public', async () => {
      findUniqueSpy.mockResolvedValue({ ...mockPrompt, isPublic: true });
      const result = await service.findOne(BigInt(1), undefined);
      expect(result).not.toBeNull();
      expect(result.id).toBe(BigInt(1));
    });

    it('should return null if private prompt is accessed by non-owner', async () => {
      findUniqueSpy.mockResolvedValue(mockPrompt);
      const result = await service.findOne(BigInt(1), BigInt(101));
      expect(result).toBeNull();
    });

    it('should return prompt if private prompt is accessed by owner', async () => {
      findUniqueSpy.mockResolvedValue(mockPrompt);
      const result = await service.findOne(BigInt(1), BigInt(100));
      expect(result).not.toBeNull();
      expect(result.id).toBe(BigInt(1));
    });
  });

  describe('findBookmarks', () => {
    it('should apply OR filter in prompt relation for public or owned prompts', async () => {
      const bookmarkFindManySpy = jest.spyOn(mockPrismaService.bookmark, 'findMany');
      await service.findBookmarks(1, 10, BigInt(100));

      expect(bookmarkFindManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: BigInt(100),
            prompt: expect.objectContaining({
              isDelete: false,
              OR: [
                { isPublic: true },
                { userId: BigInt(100) }
              ],
            }),
          }),
        }),
      );
    });
  });
});
