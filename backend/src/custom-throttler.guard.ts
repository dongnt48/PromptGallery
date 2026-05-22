import { Injectable, ExecutionContext, Logger, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { PrismaService } from './prisma/prisma.service';
import { createHash } from 'crypto';
import { verify } from 'jsonwebtoken';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly customLogger = new Logger('RateLimit');
  
  @Inject(PrismaService)
  private readonly prisma: PrismaService;

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.Authentication;
    if (!token) return false;

    try {
      const secret = process.env.JWT_SECRET || 'SECRET_KEY';
      const payload: any = verify(token, secret);
      if (payload && payload.role === 'admin') {
        return true; // Skip rate limiting for admin users
      }
    } catch (err) {
      // Invalid token, do not skip
    }
    return false;
  }

  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    // Generate a global rate limit key based only on the IP (suffix) and throttler config name.
    // This blocks the user globally across all API routes once they hit the limit on any API.
    const prefix = `global-${name}`;
    return createHash('sha256').update(`${prefix}-${suffix}`).digest('hex');
  }

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
