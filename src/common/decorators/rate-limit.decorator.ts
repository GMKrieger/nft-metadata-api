import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../guards/rate-limit.guard';

/**
 * Decorator to set custom rate limits for a route
 * @param options Rate limit options (perMinute, perDay)
 */
export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
