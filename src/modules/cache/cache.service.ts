import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKeyUtil } from './cache-key.util';
import { CacheKeyOptions, CachedNftData } from './interfaces/cache.interface';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly TTL = 3600; // 1 hour in seconds

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Get NFT metadata from Redis cache
   */
  async getNftMetadata(options: CacheKeyOptions): Promise<CachedNftData | null> {
    try {
      const key = CacheKeyUtil.generateNftKey(options);
      const cached = await this.cacheManager.get<CachedNftData>(key);

      if (cached) {
        this.logger.debug(`Redis cache HIT for key: ${key}`);
        return cached;
      }

      this.logger.debug(`Redis cache MISS for key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error('Error getting from Redis cache:', error);
      return null;
    }
  }

  /**
   * Set NFT metadata in Redis cache
   */
  async setNftMetadata(options: CacheKeyOptions, data: CachedNftData): Promise<void> {
    try {
      const key = CacheKeyUtil.generateNftKey(options);
      await this.cacheManager.set(key, data, this.TTL * 1000); // Convert to milliseconds
      this.logger.debug(`Cached NFT metadata with key: ${key}`);
    } catch (error) {
      this.logger.error('Error setting Redis cache:', error);
    }
  }

  /**
   * Delete NFT metadata from cache
   */
  async deleteNftMetadata(options: CacheKeyOptions): Promise<void> {
    try {
      const key = CacheKeyUtil.generateNftKey(options);
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting from Redis cache:', error);
    }
  }

  /**
   * Get collection metadata from cache
   */
  async getCollectionMetadata(chain: string, contractAddress: string): Promise<any | null> {
    try {
      const key = CacheKeyUtil.generateCollectionKey(chain, contractAddress);
      const cached = await this.cacheManager.get(key);

      if (cached) {
        this.logger.debug(`Redis cache HIT for collection: ${key}`);
        return cached;
      }

      this.logger.debug(`Redis cache MISS for collection: ${key}`);
      return null;
    } catch (error) {
      this.logger.error('Error getting collection from Redis cache:', error);
      return null;
    }
  }

  /**
   * Set collection metadata in cache
   */
  async setCollectionMetadata(
    chain: string,
    contractAddress: string,
    data: any,
  ): Promise<void> {
    try {
      const key = CacheKeyUtil.generateCollectionKey(chain, contractAddress);
      await this.cacheManager.set(key, data, this.TTL * 1000);
      this.logger.debug(`Cached collection metadata with key: ${key}`);
    } catch (error) {
      this.logger.error('Error setting collection in Redis cache:', error);
    }
  }

  /**
   * Invalidate cache by pattern
   * Note: This requires Redis SCAN command and may be slow on large datasets
   */
  async invalidateByPattern(chain?: string, contractAddress?: string): Promise<number> {
    try {
      const pattern = CacheKeyUtil.generatePattern(chain, contractAddress);
      this.logger.log(`Invalidating cache with pattern: ${pattern}`);

      // Note: cache-manager doesn't support pattern deletion by default
      // This is a limitation - in production, you might need to implement
      // a custom solution using Redis client directly
      this.logger.warn('Pattern-based cache invalidation requires direct Redis access');

      return 0;
    } catch (error) {
      this.logger.error('Error invalidating cache by pattern:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cleared all cache');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      await this.cacheManager.set(testKey, 'ok', 1000);
      const value = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);
      return value === 'ok';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }
}
