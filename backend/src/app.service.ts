import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getSitemap(): Promise<string> {
    // Fetch the latest updated/created public prompt to use its date as lastmod
    const latestPrompt = await this.prisma.prompt.findFirst({
      where: {
        isDelete: false,
        isPublic: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });

    const lastModDate = latestPrompt ? latestPrompt.updatedAt : new Date();
    const lastModIso = lastModDate.toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<!-- Dynamically generated sitemap by MODOHA Backend -->
<url>
  <loc>https://modoha.io.vn/</loc>
  <lastmod>${lastModIso}</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
</urlset>`;
  }
}
