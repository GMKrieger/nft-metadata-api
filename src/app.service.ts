import { Injectable } from '@nestjs/common';
import { CacheService } from './modules/cache/cache.service';
import { TwoTierCacheService } from './modules/cache/two-tier-cache.service';
import { EthereumService } from './modules/blockchain/ethereum.service';
import { PolygonService } from './modules/blockchain/polygon.service';
import { StarknetService } from './modules/blockchain/starknet.service';

@Injectable()
export class AppService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly twoTierCacheService: TwoTierCacheService,
    private readonly ethereumService: EthereumService,
    private readonly polygonService: PolygonService,
    private readonly starknetService: StarknetService,
  ) {}

  async getHealth() {
    const [redisHealthy, ethereumHealthy, polygonHealthy, starknetHealthy] = await Promise.all([
      this.cacheService.healthCheck(),
      this.ethereumService.checkConnection(),
      this.polygonService.checkConnection(),
      this.starknetService.checkConnection(),
    ]);

    return {
      status: redisHealthy && ethereumHealthy && polygonHealthy && starknetHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        ethereum: ethereumHealthy ? 'healthy' : 'unhealthy',
        polygon: polygonHealthy ? 'healthy' : 'unhealthy',
        starknet: starknetHealthy ? 'healthy' : 'unhealthy',
      },
    };
  }

  async getStats() {
    const stats = await this.twoTierCacheService.getStatistics();

    return {
      timestamp: new Date().toISOString(),
      cache: {
        database: {
          totalNfts: stats.database.totalNfts,
          totalCollections: stats.database.totalCollections,
          nftsByChain: stats.database.nftsByChain,
        },
        redis: {
          healthy: stats.redis.healthy,
        },
      },
    };
  }
}
