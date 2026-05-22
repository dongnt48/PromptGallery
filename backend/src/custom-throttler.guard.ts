import { Injectable, ExecutionContext, Logger, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly customLogger = new Logger('RateLimit');
  
  @Inject(PrismaService)
  private readonly prisma: PrismaService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const token = req.cookies?.Authentication;
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) {
          return `user_${payload.sub}`;
        }
      } catch {
        // Invalid or expired token, fallback to IP
      }
    }
    
    let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'Unknown';
    if (Array.isArray(ip)) ip = ip[0];
    return `ip_${ip}`;
  }

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    const req = context.switchToHttp().getRequest();
    
    let ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'Unknown';
    if (Array.isArray(ip)) ip = ip[0];
    
    let userId = 'Guest';
    const token = req.cookies?.Authentication;
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        if (payload && payload.sub) {
          userId = String(payload.sub);
        }
      } catch {}
    }
    
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
