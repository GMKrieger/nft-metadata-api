import { Module } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
import { PolygonService } from './polygon.service';
import { StarknetService } from './starknet.service';
import { BlockchainFactoryService } from './blockchain-factory.service';

@Module({
  providers: [
    EthereumService,
    PolygonService,
    StarknetService,
    BlockchainFactoryService,
  ],
  exports: [
    EthereumService,
    PolygonService,
    StarknetService,
    BlockchainFactoryService,
  ],
})
export class BlockchainModule {}
