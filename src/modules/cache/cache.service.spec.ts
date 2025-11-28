import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { CachedNftData } from './interfaces/cache.interface';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNftMetadata', () => {
    it('should return cached data when available', async () => {
      const mockData: CachedNftData = {
        contractAddress: '0xabc',
        tokenId: '1',
        chain: 'ethereum',
        name: 'Test NFT',
        description: 'Test description',
        image: 'ipfs://test',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/test',
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        tokenUri: 'ipfs://test',
        rawMetadata: {},
      };

      mockCacheManager.get.mockResolvedValue(mockData);

      const result = await service.getNftMetadata({
        chain: 'ethereum',
        contractAddress: '0xabc',
        tokenId: '1',
      });

      expect(result).toEqual(mockData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('nft:ethereum:0xabc:1');
    });

    it('should return null when cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getNftMetadata({
        chain: 'ethereum',
        contractAddress: '0xabc',
        tokenId: '1',
      });

      expect(result).toBeNull();
    });

    it('should return null on cache error', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.getNftMetadata({
        chain: 'ethereum',
        contractAddress: '0xabc',
        tokenId: '1',
      });

      expect(result).toBeNull();
    });
  });

  describe('setNftMetadata', () => {
    it('should set cache with TTL', async () => {
      const mockData: CachedNftData = {
        contractAddress: '0xabc',
        tokenId: '1',
        chain: 'ethereum',
        name: 'Test NFT',
        description: null,
        image: null,
        imageUrl: null,
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        tokenUri: 'ipfs://test',
        rawMetadata: {},
      };

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.setNftMetadata(
        {
          chain: 'ethereum',
          contractAddress: '0xabc',
          tokenId: '1',
        },
        mockData,
      );

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'nft:ethereum:0xabc:1',
        mockData,
        3600000, // 1 hour in milliseconds
      );
    });
  });

  describe('deleteNftMetadata', () => {
    it('should delete from cache', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.deleteNftMetadata({
        chain: 'ethereum',
        contractAddress: '0xabc',
        tokenId: '1',
      });

      expect(mockCacheManager.del).toHaveBeenCalledWith('nft:ethereum:0xabc:1');
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('ok');
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when Redis is unhealthy', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Connection error'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should reset all cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clearAll();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });
});
