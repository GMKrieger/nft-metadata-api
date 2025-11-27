import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockchainFactoryService, SupportedChain } from './blockchain-factory.service';
import { EthereumService } from './ethereum.service';
import { PolygonService } from './polygon.service';
import { StarknetService } from './starknet.service';

describe('BlockchainFactoryService', () => {
  let service: BlockchainFactoryService;
  let ethereumService: EthereumService;
  let polygonService: PolygonService;
  let starknetService: StarknetService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ETHEREUM_RPC_URL') return 'https://eth-mainnet.g.alchemy.com/v2/test';
      if (key === 'POLYGON_RPC_URL') return 'https://polygon-mainnet.g.alchemy.com/v2/test';
      if (key === 'STARKNET_RPC_URL') return 'https://starknet-mainnet.g.alchemy.com/v2/test';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainFactoryService,
        EthereumService,
        PolygonService,
        StarknetService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BlockchainFactoryService>(BlockchainFactoryService);
    ethereumService = module.get<EthereumService>(EthereumService);
    polygonService = module.get<PolygonService>(PolygonService);
    starknetService = module.get<StarknetService>(StarknetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBlockchainService', () => {
    it('should return EthereumService for ethereum chain', () => {
      const result = service.getBlockchainService('ethereum');
      expect(result).toBe(ethereumService);
    });

    it('should return PolygonService for polygon chain', () => {
      const result = service.getBlockchainService('polygon');
      expect(result).toBe(polygonService);
    });

    it('should return StarknetService for starknet chain', () => {
      const result = service.getBlockchainService('starknet');
      expect(result).toBe(starknetService);
    });

    it('should handle case-insensitive chain names', () => {
      expect(service.getBlockchainService('ETHEREUM')).toBe(ethereumService);
      expect(service.getBlockchainService('Polygon')).toBe(polygonService);
      expect(service.getBlockchainService('StarkNet')).toBe(starknetService);
    });

    it('should throw BadRequestException for unsupported chain', () => {
      expect(() => service.getBlockchainService('bitcoin')).toThrow(BadRequestException);
      expect(() => service.getBlockchainService('solana')).toThrow(BadRequestException);
    });
  });

  describe('getSupportedChains', () => {
    it('should return array of supported chains', () => {
      const chains = service.getSupportedChains();
      expect(chains).toEqual([
        SupportedChain.ETHEREUM,
        SupportedChain.POLYGON,
        SupportedChain.STARKNET,
      ]);
    });
  });

  describe('isChainSupported', () => {
    it('should return true for supported chains', () => {
      expect(service.isChainSupported('ethereum')).toBe(true);
      expect(service.isChainSupported('polygon')).toBe(true);
      expect(service.isChainSupported('starknet')).toBe(true);
    });

    it('should return false for unsupported chains', () => {
      expect(service.isChainSupported('bitcoin')).toBe(false);
      expect(service.isChainSupported('solana')).toBe(false);
    });

    it('should handle case-insensitive chain names', () => {
      expect(service.isChainSupported('ETHEREUM')).toBe(true);
      expect(service.isChainSupported('Polygon')).toBe(true);
    });
  });
});
