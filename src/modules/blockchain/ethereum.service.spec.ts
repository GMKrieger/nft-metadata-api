import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EthereumService } from './ethereum.service';

describe('EthereumService', () => {
  let service: EthereumService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EthereumService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ETHEREUM_RPC_URL') {
                return 'https://eth-mainnet.g.alchemy.com/v2/test-key';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EthereumService>(EthereumService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct chain name', () => {
    expect(service.getChainName()).toBe('ethereum');
  });

  it('should throw error if RPC URL is not configured', () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);
    expect(() => {
      new EthereumService(configService);
    }).toThrow('ETHEREUM_RPC_URL is not configured');
  });

  describe('getContractMetadata', () => {
    it('should handle invalid contract address gracefully', async () => {
      const invalidAddress = '0xinvalid';
      const result = await service.getContractMetadata(invalidAddress);
      expect(result.contractType).toBe('UNKNOWN');
      expect(result.name).toBeNull();
      expect(result.symbol).toBeNull();
    });
  });

  describe('getTokenUri', () => {
    it('should handle invalid contract address gracefully', async () => {
      const invalidAddress = '0xinvalid';
      const tokenId = '1';
      await expect(service.getTokenUri(invalidAddress, tokenId)).rejects.toThrow();
    });
  });
});
