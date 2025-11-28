import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { DatabaseCacheService } from './database-cache.service';
import { CacheKeyOptions, CachedNftData } from './interfaces/cache.interface';
import { NftMetadata } from '../nft/entities/nft-metadata.entity';
import { NftCollection } from '../nft/entities/nft-collection.entity';

export interface CacheResult<T> {
  data: T | null;
  source: 'redis' | 'database' | 'none';
}

@Injectable()
export class TwoTierCacheService {
  private readonly logger = new Logger(TwoTierCacheService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly databaseCacheService: DatabaseCacheService,
  ) {}

  /**
   * Get NFT metadata with two-tier caching
   * 1. Check Redis (hot cache)
   * 2. Check PostgreSQL (persistent cache)
   * 3. Return null if not found
   */
  async getNftMetadata(options: CacheKeyOptions): Promise<CacheResult<NftMetadata>> {
    // Try Redis first (hot cache)
    const redisData = await this.cacheService.getNftMetadata(options);

    if (redisData) {
      this.logger.debug('Cache HIT from Redis');
      // Convert cached data to entity format
      const entity = this.cachedDataToEntity(redisData);
      return { data: entity, source: 'redis' };
    }

    // Try PostgreSQL (persistent cache)
    const dbData = await this.databaseCacheService.getNftMetadata(options);

    if (dbData) {
      this.logger.debug('Cache HIT from Database, promoting to Redis');

      // Promote to Redis cache
      const cachedData = this.entityToCachedData(dbData);
      await this.cacheService.setNftMetadata(options, cachedData);

      return { data: dbData, source: 'database' };
    }

    this.logger.debug('Cache MISS from both Redis and Database');
    return { data: null, source: 'none' };
  }

  /**
   * Set NFT metadata in both caches
   */
  async setNftMetadata(options: CacheKeyOptions, data: CachedNftData): Promise<void> {
    // Save to both Redis and PostgreSQL
    await Promise.all([
      this.cacheService.setNftMetadata(options, data),
      this.databaseCacheService.setNftMetadata(options, data),
    ]);

    this.logger.debug('Saved NFT metadata to both Redis and Database');
  }

  /**
   * Get collection metadata with two-tier caching
   */
  async getCollectionMetadata(
    chain: string,
    contractAddress: string,
  ): Promise<CacheResult<NftCollection>> {
    // Try Redis first
    const redisData = await this.cacheService.getCollectionMetadata(chain, contractAddress);

    if (redisData) {
      return { data: redisData, source: 'redis' };
    }

    // Try PostgreSQL
    const dbData = await this.databaseCacheService.getCollectionMetadata(chain, contractAddress);

    if (dbData) {
      // Promote to Redis
      await this.cacheService.setCollectionMetadata(chain, contractAddress, dbData);
      return { data: dbData, source: 'database' };
    }

    return { data: null, source: 'none' };
  }

  /**
   * Set collection metadata in both caches
   */
  async setCollectionMetadata(
    chain: string,
    contractAddress: string,
    data: {
      name: string | null;
      symbol: string | null;
      totalSupply: string | null;
      contractType: string;
    },
  ): Promise<void> {
    await Promise.all([
      this.cacheService.setCollectionMetadata(chain, contractAddress, data),
      this.databaseCacheService.setCollectionMetadata(chain, contractAddress, data),
    ]);

    this.logger.debug('Saved collection metadata to both Redis and Database');
  }

  /**
   * Invalidate NFT metadata from both caches
   */
  async invalidateNftMetadata(options: CacheKeyOptions): Promise<void> {
    await Promise.all([
      this.cacheService.deleteNftMetadata(options),
      this.databaseCacheService.deleteNftMetadata(options),
    ]);

    this.logger.log(`Invalidated NFT cache: ${options.chain}:${options.contractAddress}:${options.tokenId}`);
  }

  /**
   * Invalidate entire collection from both caches
   */
  async invalidateCollection(chain: string, contractAddress: string): Promise<number> {
    // Clear from Redis (pattern-based, may not work with all cache implementations)
    await this.cacheService.invalidateByPattern(chain, contractAddress);

    // Clear from database
    const deletedCount = await this.databaseCacheService.deleteCollectionCache(
      chain,
      contractAddress,
    );

    this.logger.log(`Invalidated collection cache: ${chain}:${contractAddress} (${deletedCount} items)`);

    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  async getStatistics(): Promise<{
    database: {
      totalNfts: number;
      totalCollections: number;
      nftsByChain: Record<string, number>;
    };
    redis: {
      healthy: boolean;
    };
  }> {
    const [dbStats, redisHealthy] = await Promise.all([
      this.databaseCacheService.getCacheStats(),
      this.cacheService.healthCheck(),
    ]);

    return {
      database: dbStats,
      redis: {
        healthy: redisHealthy,
      },
    };
  }

  /**
   * Convert entity to cached data format
   */
  private entityToCachedData(entity: NftMetadata): CachedNftData {
    return {
      contractAddress: entity.contractAddress,
      tokenId: entity.tokenId,
      chain: entity.chain,
      name: entity.name,
      description: entity.description,
      image: entity.image,
      imageUrl: entity.imageUrl,
      animationUrl: entity.animationUrl,
      externalUrl: entity.externalUrl,
      attributes: entity.attributes,
      tokenUri: entity.tokenUri,
      rawMetadata: entity.rawMetadata,
    };
  }

  /**
   * Convert cached data to entity format
   */
  private cachedDataToEntity(data: CachedNftData): NftMetadata {
    const entity = new NftMetadata();
    entity.contractAddress = data.contractAddress;
    entity.tokenId = data.tokenId;
    entity.chain = data.chain;
    entity.name = data.name;
    entity.description = data.description;
    entity.image = data.image;
    entity.imageUrl = data.imageUrl;
    entity.animationUrl = data.animationUrl;
    entity.externalUrl = data.externalUrl;
    entity.attributes = data.attributes;
    entity.tokenUri = data.tokenUri;
    entity.rawMetadata = data.rawMetadata;

    return entity;
  }
}
