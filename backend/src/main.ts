import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

// Patch for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove undefined properties
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));

  // Serve uploaded files as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
