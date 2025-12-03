import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NftService } from './nft.service';
import { BlockchainFactoryService } from '../blockchain/blockchain-factory.service';
import { MetadataService } from '../metadata/metadata.service';
import { TwoTierCacheService } from '../cache/two-tier-cache.service';

describe('NftService', () => {
  let service: NftService;
  let blockchainFactory: BlockchainFactoryService;
  let metadataService: MetadataService;
  let cacheService: TwoTierCacheService;

  const mockBlockchainService = {
    getTokenUri: jest.fn(),
    getContractMetadata: jest.fn(),
  };

  const mockBlockchainFactory = {
    getBlockchainService: jest.fn(() => mockBlockchainService),
  };

  const mockMetadataService = {
    fetchMetadata: jest.fn(),
  };

  const mockCacheService = {
    getNftMetadata: jest.fn(),
    setNftMetadata: jest.fn(),
    getCollectionMetadata: jest.fn(),
    setCollectionMetadata: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftService,
        {
          provide: BlockchainFactoryService,
          useValue: mockBlockchainFactory,
        },
        {
          provide: MetadataService,
          useValue: mockMetadataService,
        },
        {
          provide: TwoTierCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<NftService>(NftService);
    blockchainFactory = module.get<BlockchainFactoryService>(BlockchainFactoryService);
    metadataService = module.get<MetadataService>(MetadataService);
    cacheService = module.get<TwoTierCacheService>(TwoTierCacheService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNftMetadata', () => {
    const chain = 'ethereum';
    const contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const tokenId = '1';

    it('should return cached metadata when cache hit', async () => {
      const cachedData = {
        contractAddress,
        tokenId,
        chain,
        name: 'Cached NFT',
        description: 'From cache',
        image: 'ipfs://test',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/test',
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        tokenUri: 'ipfs://test',
        rawMetadata: {},
        updatedAt: new Date(),
      };

      mockCacheService.getNftMetadata.mockResolvedValue({
        data: cachedData,
        source: 'redis',
      });

      const result = await service.getNftMetadata(chain, contractAddress, tokenId, false);

      expect(result.name).toBe('Cached NFT');
      expect(result.cached).toBe(true);
      expect(mockCacheService.getNftMetadata).toHaveBeenCalledWith({
        chain,
        contractAddress,
        tokenId,
      });
      expect(mockBlockchainService.getTokenUri).not.toHaveBeenCalled();
    });

    it('should fetch from blockchain when cache miss', async () => {
      mockCacheService.getNftMetadata.mockResolvedValue({
        data: null,
        source: 'none',
      });

      mockBlockchainService.getTokenUri.mockResolvedValue('ipfs://QmTest123');

      mockMetadataService.fetchMetadata.mockResolvedValue({
        name: 'Fresh NFT',
        description: 'From blockchain',
        image: 'ipfs://QmImage',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/QmImage',
        animationUrl: null,
        externalUrl: null,
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
        rawMetadata: {},
      });

      const result = await service.getNftMetadata(chain, contractAddress, tokenId, false);

      expect(result.name).toBe('Fresh NFT');
      expect(result.cached).toBe(false);
      expect(mockBlockchainService.getTokenUri).toHaveBeenCalledWith(contractAddress, tokenId);
      expect(mockMetadataService.fetchMetadata).toHaveBeenCalledWith('ipfs://QmTest123');
      expect(mockCacheService.setNftMetadata).toHaveBeenCalled();
    });

    it('should bypass cache when refresh=true', async () => {
      mockBlockchainService.getTokenUri.mockResolvedValue('ipfs://QmTest123');

      mockMetadataService.fetchMetadata.mockResolvedValue({
        name: 'Refreshed NFT',
        description: null,
        image: null,
        imageUrl: null,
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        rawMetadata: {},
      });

      const result = await service.getNftMetadata(chain, contractAddress, tokenId, true);

      expect(result.name).toBe('Refreshed NFT');
      expect(mockCacheService.getNftMetadata).not.toHaveBeenCalled();
      expect(mockBlockchainService.getTokenUri).toHaveBeenCalled();
    });

    it('should throw NotFoundException when tokenURI is null', async () => {
      mockCacheService.getNftMetadata.mockResolvedValue({
        data: null,
        source: 'none',
      });

      mockBlockchainService.getTokenUri.mockResolvedValue(null);

      await expect(service.getNftMetadata(chain, contractAddress, tokenId, false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCollectionMetadata', () => {
    const chain = 'ethereum';
    const contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';

    it('should return cached collection metadata when cache hit', async () => {
      const cachedData = {
        chain,
        contractAddress,
        name: 'Bored Ape Yacht Club',
        symbol: 'BAYC',
        totalSupply: '10000',
        contractType: 'ERC721',
        updatedAt: new Date(),
      };

      mockCacheService.getCollectionMetadata.mockResolvedValue({
        data: cachedData,
        source: 'redis',
      });

      const result = await service.getCollectionMetadata(chain, contractAddress);

      expect(result.name).toBe('Bored Ape Yacht Club');
      expect(result.symbol).toBe('BAYC');
      expect(mockCacheService.getCollectionMetadata).toHaveBeenCalledWith(chain, contractAddress);
      expect(mockBlockchainService.getContractMetadata).not.toHaveBeenCalled();
    });

    it('should fetch from blockchain when cache miss', async () => {
      mockCacheService.getCollectionMetadata.mockResolvedValue({
        data: null,
        source: 'none',
      });

      mockBlockchainService.getContractMetadata.mockResolvedValue({
        name: 'Test Collection',
        symbol: 'TEST',
        totalSupply: '1000',
        contractType: 'ERC721',
      });

      const result = await service.getCollectionMetadata(chain, contractAddress);

      expect(result.name).toBe('Test Collection');
      expect(result.symbol).toBe('TEST');
      expect(mockBlockchainService.getContractMetadata).toHaveBeenCalledWith(contractAddress);
      expect(mockCacheService.setCollectionMetadata).toHaveBeenCalled();
    });
  });
});
