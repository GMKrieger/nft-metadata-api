import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  perMinute?: number;
  perDay?: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultPerMinute: number;
  private readonly defaultPerDay: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.defaultPerMinute = this.configService.get<number>('RATE_LIMIT_PER_MINUTE', 100);
    this.defaultPerDay = this.configService.get<number>('RATE_LIMIT_PER_DAY', 1000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get API key from request (set by ApiKeyGuard)
    const apiKey = (request as any).apiKey || 'anonymous';

    // Get rate limit options from decorator
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());

    const perMinute = options?.perMinute || this.defaultPerMinute;
    const perDay = options?.perDay || this.defaultPerDay;

    // Check rate limits
    await this.checkRateLimit(apiKey, perMinute, perDay);

    return true;
  }

  private async checkRateLimit(
    apiKey: string,
    perMinute: number,
    perDay: number,
  ): Promise<void> {
    const now = Date.now();
    const minuteKey = `rate:${apiKey}:minute:${Math.floor(now / 60000)}`;
    const dayKey = `rate:${apiKey}:day:${new Date().toISOString().split('T')[0]}`;

    // Check minute limit
    const minuteCount = await this.incrementCounter(minuteKey, 60); // 60 seconds TTL
    if (minuteCount > perMinute) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded: too many requests per minute',
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check day limit
    const dayCount = await this.incrementCounter(dayKey, 86400); // 24 hours TTL
    if (dayCount > perDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded: daily limit reached',
          retryAfter: this.getSecondsUntilMidnight(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    try {
      const current = await this.cacheManager.get<number>(key);

      if (current === null || current === undefined) {
        await this.cacheManager.set(key, 1, ttlSeconds * 1000);
        return 1;
      }

      const newCount = current + 1;
      await this.cacheManager.set(key, newCount, ttlSeconds * 1000);
      return newCount;
    } catch (error) {
      // If Redis is down, allow the request (fail open)
      return 0;
    }
  }

  private getSecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  }
}
