import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// Patch for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove undefined properties
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
