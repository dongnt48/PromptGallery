import { PrismaService } from '../prisma/prisma.service';
export declare class PromptsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        user: {
            id: string;
            username: string;
            avatar_url: string | null;
        };
        images: {
            id: string;
            createdAt: Date;
            isCover: boolean;
            promptId: string;
            imageUrl: string;
        }[];
        tags: ({
            tag: {
                id: number;
                name: string;
                slug: string;
            };
        } & {
            promptId: string;
            tagId: number;
        })[];
    } & {
        id: string;
        userId: string;
        content: string;
        negativePrompt: string | null;
        aiModel: string;
        seed: string | null;
        sampler: string | null;
        steps: number | null;
        cfgScale: import("@prisma/client-runtime-utils").Decimal | null;
        viewsCount: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
