import { Injectable, BadRequestException } from '@nestjs/common';
import { EthereumService } from './ethereum.service';
import { PolygonService } from './polygon.service';
import { StarknetService } from './starknet.service';
import { IBlockchainService } from './interfaces/blockchain.interface';

export enum SupportedChain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  STARKNET = 'starknet',
}

@Injectable()
export class BlockchainFactoryService {
  constructor(
    private readonly ethereumService: EthereumService,
    private readonly polygonService: PolygonService,
    private readonly starknetService: StarknetService,
  ) {}

  getBlockchainService(chain: string): IBlockchainService {
    const normalizedChain = chain.toLowerCase();

    switch (normalizedChain) {
      case SupportedChain.ETHEREUM:
        return this.ethereumService;
      case SupportedChain.POLYGON:
        return this.polygonService;
      case SupportedChain.STARKNET:
        return this.starknetService;
      default:
        throw new BadRequestException(
          `Unsupported chain: ${chain}. Supported chains: ${Object.values(SupportedChain).join(', ')}`,
        );
    }
  }

  getSupportedChains(): string[] {
    return Object.values(SupportedChain);
  }

  isChainSupported(chain: string): boolean {
    const normalizedChain = chain.toLowerCase();
    return Object.values(SupportedChain).includes(normalizedChain as SupportedChain);
  }
}
