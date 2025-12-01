import { Module } from '@nestjs/common';
import { NftController } from './nft.controller';
import { CollectionController } from './collection.controller';
import { NftService } from './nft.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { MetadataModule } from '../metadata/metadata.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [BlockchainModule, MetadataModule, CacheModule],
  controllers: [NftController, CollectionController],
  providers: [NftService],
  exports: [NftService],
})
export class NftModule {}
