import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheService } from './cache.service';
import { DatabaseCacheService } from './database-cache.service';
import { TwoTierCacheService } from './two-tier-cache.service';
import { NftMetadata } from '../nft/entities/nft-metadata.entity';
import { NftCollection } from '../nft/entities/nft-collection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NftMetadata, NftCollection])],
  providers: [CacheService, DatabaseCacheService, TwoTierCacheService],
  exports: [CacheService, DatabaseCacheService, TwoTierCacheService],
})
export class CacheModule {}
