import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from './metadata.service';
import { IpfsService } from './ipfs.service';

describe('MetadataService', () => {
  let service: MetadataService;
  let ipfsService: IpfsService;

  const mockIpfsService = {
    isIpfsUrl: jest.fn(),
    fetchFromIpfs: jest.fn(),
    normalizeIpfsUri: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        {
          provide: IpfsService,
          useValue: mockIpfsService,
        },
      ],
    }).compile();

    service = module.get<MetadataService>(MetadataService);
    ipfsService = module.get<IpfsService>(IpfsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchMetadata', () => {
    it('should parse valid JSON metadata', async () => {
      const metadata = {
        name: 'Test NFT',
        description: 'A test NFT',
        image: 'ipfs://QmTest',
        attributes: [
          {
            trait_type: 'Color',
            value: 'Blue',
          },
        ],
      };

      mockIpfsService.isIpfsUrl.mockReturnValue(true);
      mockIpfsService.fetchFromIpfs.mockResolvedValue(JSON.stringify(metadata));
      mockIpfsService.normalizeIpfsUri.mockReturnValue('https://gateway.pinata.cloud/ipfs/QmTest');

      const result = await service.fetchMetadata('ipfs://QmTest');

      expect(result.name).toBe('Test NFT');
      expect(result.description).toBe('A test NFT');
      expect(result.image).toBe('ipfs://QmTest');
      expect(result.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/QmTest');
      expect(result.attributes).toHaveLength(1);
      expect(result.attributes?.[0].trait_type).toBe('Color');
    });

    it('should handle missing optional fields', async () => {
      const metadata = {
        name: 'Minimal NFT',
      };

      mockIpfsService.isIpfsUrl.mockReturnValue(true);
      mockIpfsService.fetchFromIpfs.mockResolvedValue(JSON.stringify(metadata));

      const result = await service.fetchMetadata('ipfs://QmTest');

      expect(result.name).toBe('Minimal NFT');
      expect(result.description).toBeNull();
      expect(result.image).toBeNull();
      expect(result.attributes).toBeNull();
    });

    it('should handle malformed attributes gracefully', async () => {
      const metadata = {
        name: 'Test NFT',
        attributes: [
          { trait_type: 'Valid', value: 'Good' },
          { invalid: 'attribute' }, // Missing required fields
          { trait_type: 'Another', value: 123 }, // Numeric value
        ],
      };

      mockIpfsService.isIpfsUrl.mockReturnValue(true);
      mockIpfsService.fetchFromIpfs.mockResolvedValue(JSON.stringify(metadata));

      const result = await service.fetchMetadata('ipfs://QmTest');

      expect(result.attributes).toHaveLength(2);
      expect(result.attributes?.[0].trait_type).toBe('Valid');
      expect(result.attributes?.[1].value).toBe(123);
    });
  });

  describe('validateMetadata', () => {
    it('should validate metadata with name', () => {
      const metadata = {
        name: 'Test NFT',
        description: null,
        image: null,
        imageUrl: null,
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        rawMetadata: {},
      };

      expect(service.validateMetadata(metadata)).toBe(true);
    });

    it('should validate metadata with image', () => {
      const metadata = {
        name: null,
        description: null,
        image: 'ipfs://QmTest',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/QmTest',
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        rawMetadata: {},
      };

      expect(service.validateMetadata(metadata)).toBe(true);
    });

    it('should invalidate metadata without name or image', () => {
      const metadata = {
        name: null,
        description: 'Only description',
        image: null,
        imageUrl: null,
        animationUrl: null,
        externalUrl: null,
        attributes: null,
        rawMetadata: {},
      };

      expect(service.validateMetadata(metadata)).toBe(false);
    });
  });
});
