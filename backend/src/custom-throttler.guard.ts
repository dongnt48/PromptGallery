import { Injectable, ExecutionContext, Logger, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly customLogger = new Logger('RateLimit');
  
  @Inject(PrismaService)
  private readonly prisma: PrismaService;

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    const req = context.switchToHttp().getRequest();
    
    let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'Unknown';
    if (Array.isArray(ip)) ip = ip[0];
    
    const userId = req.user ? String(req.user.id) : 'Guest';
    const pathUrl = req.originalUrl || req.url || '';
    
    // 1. Log to console for development visibility
    this.customLogger.warn(`Rate limit exceeded by IP: ${ip} | User: ${userId} | Path: ${pathUrl}`);

    // 2. Insert into DB
    try {
      await this.prisma.rateLimitLog.create({
        data: {
          ip: ip.substring(0, 50),
          userId: userId.substring(0, 50),
          path: pathUrl.substring(0, 255),
        }
      });
    } catch (err) {
      this.customLogger.error(`Failed to write to rate_limit_logs DB: ${err.message}`);
    }

    // Call the parent method to actually throw the 429 error
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
