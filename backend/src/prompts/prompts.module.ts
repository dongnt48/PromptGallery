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
          const date = new Date();
          const year = date.getFullYear().toString();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const folderName = `${year}${month}${day}`;
          
          const targetDir = join(uploadsDir, folderName);
          if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
          }
          
          cb(null, targetDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only image and video files are allowed'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 5,
      },
    }),
  ],
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
