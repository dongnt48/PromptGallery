import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PromptsModule } from './prompts/prompts.module';

@Module({
  imports: [PrismaModule, PromptsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
