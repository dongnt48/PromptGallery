import { Module } from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { PromptsController } from './prompts.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'SECRET_KEY',
      }),
      inject: [ConfigService],
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5,
      },
    }),
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
