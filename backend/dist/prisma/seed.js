"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
require("dotenv/config");
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            username: 'lumina_artist',
            password_hash: 'mock_hash',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
            bio: 'Digital artist exploring AI generated visuals.',
        },
    });
    const tagsData = [
        { name: 'Cinematic', slug: 'cinematic' },
        { name: 'Minimalist', slug: 'minimalist' },
        { name: 'Portrait', slug: 'portrait' },
        { name: 'Sci-Fi', slug: 'sci-fi' },
        { name: 'Fantasy', slug: 'fantasy' },
    ];
    const createdTags = [];
    for (const t of tagsData) {
        const tag = await prisma.tag.upsert({
            where: { slug: t.slug },
            update: {},
            create: t,
        });
        createdTags.push(tag);
    }
    const promptsData = [
        {
            content: 'A hyper-realistic cinematic portrait of an astronaut on a desert planet, glowing neon lights, 8k resolution.',
            aiModel: 'Midjourney v6',
            tags: ['cinematic', 'sci-fi', 'portrait'],
            images: [
                'https://picsum.photos/id/177/800/1200',
                'https://picsum.photos/id/178/800/1000',
            ],
        },
        {
            content: 'Minimalist editorial photography of a white ceramic vase with dried pampas grass on a marble table, soft studio lighting.',
            aiModel: 'Stable Diffusion XL',
            tags: ['minimalist'],
            images: [
                'https://picsum.photos/id/106/800/600',
                'https://picsum.photos/id/107/800/800',
                'https://picsum.photos/id/108/800/1000',
            ],
        },
        {
            content: 'Epic fantasy landscape, floating islands with waterfalls, giant glowing crystals, ethereal atmosphere, highly detailed concept art.',
            aiModel: 'DALL-E 3',
            tags: ['fantasy', 'cinematic'],
            images: [
                'https://picsum.photos/id/29/800/500',
            ],
        },
        {
            content: 'A futuristic cyberpunk city alleyway at night, rain reflecting neon signs, a lone figure in a glowing jacket standing in the distance.',
            aiModel: 'Midjourney v6',
            tags: ['sci-fi', 'cinematic'],
            images: [
                'https://picsum.photos/id/43/800/1400',
                'https://picsum.photos/id/44/800/1000',
            ],
        },
        {
            content: 'Close-up macro photography of a colorful jumping spider, vibrant colors, shallow depth of field, nature documentary style.',
            aiModel: 'Stable Diffusion 1.5',
            tags: ['portrait'],
            images: [
                'https://picsum.photos/id/59/800/800',
            ],
        },
        {
            content: 'A cozy modern living room with large windows overlooking a snowy mountain, fireplace, warm lighting, interior design.',
            aiModel: 'Midjourney v5',
            tags: ['minimalist'],
            images: [
                'https://picsum.photos/id/74/800/1000',
                'https://picsum.photos/id/75/800/600',
            ],
        },
        {
            content: 'A mystical ancient temple hidden deep in the jungle, overgrown with glowing blue vines, cinematic lighting.',
            aiModel: 'Midjourney v6',
            tags: ['fantasy', 'cinematic'],
            images: [
                'https://picsum.photos/id/95/800/1100',
            ],
        },
        {
            content: 'Abstract geometric shapes floating in space, neon pink and teal color palette, 3d render, octane render.',
            aiModel: 'DALL-E 3',
            tags: ['sci-fi', 'minimalist'],
            images: [
                'https://picsum.photos/id/111/800/800',
            ],
        },
        {
            content: 'A vintage film photo of a bustling street in Tokyo during the 1980s, neon signs, nostalgic feel, film grain.',
            aiModel: 'Midjourney v6',
            tags: ['cinematic'],
            images: [
                'https://picsum.photos/id/144/800/600',
                'https://picsum.photos/id/145/800/1000',
            ],
        },
        {
            content: 'A beautiful elf warrior princess in silver armor, magical glowing sword, dramatic lighting, fantasy character design.',
            aiModel: 'Stable Diffusion XL',
            tags: ['fantasy', 'portrait'],
            images: [
                'https://picsum.photos/id/158/800/1200',
            ],
        }
    ];
    await prisma.prompt.deleteMany();
    for (const p of promptsData) {
        const prompt = await prisma.prompt.create({
            data: {
                userId: user.id,
                content: p.content,
                aiModel: p.aiModel,
                images: {
                    create: p.images.map((url, index) => ({
                        imageUrl: url,
                        isCover: index === 0,
                    })),
                },
                tags: {
                    create: p.tags.map(tagSlug => {
                        const tag = createdTags.find(t => t.slug === tagSlug);
                        return {
                            tag: {
                                connect: { id: tag?.id },
                            },
                        };
                    }),
                },
            },
        });
        console.log(`Created prompt: ${prompt.id}`);
    }
    console.log('Seed data inserted successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map