import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IpfsService } from './ipfs.service';

describe('IpfsService', () => {
  let service: IpfsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpfsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IpfsService>(IpfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeIpfsUri', () => {
    it('should normalize ipfs:// protocol', () => {
      const uri = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const normalized = service.normalizeIpfsUri(uri);
      expect(normalized).toContain('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      expect(normalized).toMatch(/^https?:\/\//);
    });

    it('should handle /ipfs/ prefix', () => {
      const uri = '/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const normalized = service.normalizeIpfsUri(uri);
      expect(normalized).toContain('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      expect(normalized).toMatch(/^https?:\/\//);
    });

    it('should return HTTP URLs as-is', () => {
      const uri = 'https://example.com/metadata.json';
      const normalized = service.normalizeIpfsUri(uri);
      expect(normalized).toBe(uri);
    });

    it('should handle raw IPFS hash', () => {
      const hash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const normalized = service.normalizeIpfsUri(hash);
      expect(normalized).toContain(hash);
      expect(normalized).toMatch(/^https?:\/\//);
    });

    it('should throw error for empty URI', () => {
      expect(() => service.normalizeIpfsUri('')).toThrow();
    });
  });

  describe('extractIpfsHash', () => {
    it('should extract Qm hash from ipfs:// URI', () => {
      const uri = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const hash = service.extractIpfsHash(uri);
      expect(hash).toBe('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
    });

    it('should extract hash from gateway URL', () => {
      const uri = 'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const hash = service.extractIpfsHash(uri);
      expect(hash).toBe('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
    });

    it('should extract baf hash (CIDv1)', () => {
      const uri = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const hash = service.extractIpfsHash(uri);
      expect(hash).toBe('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi');
    });

    it('should return null for non-IPFS URI', () => {
      const uri = 'https://example.com/metadata.json';
      const hash = service.extractIpfsHash(uri);
      expect(hash).toBeNull();
    });
  });

  describe('isIpfsUrl', () => {
    it('should detect ipfs:// protocol', () => {
      expect(service.isIpfsUrl('ipfs://Qm...')).toBe(true);
    });

    it('should detect /ipfs/ in URL', () => {
      expect(service.isIpfsUrl('https://gateway.pinata.cloud/ipfs/Qm...')).toBe(true);
    });

    it('should detect Qm hash', () => {
      expect(service.isIpfsUrl('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(true);
    });

    it('should detect baf hash', () => {
      expect(service.isIpfsUrl('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(
        true,
      );
    });

    it('should return false for regular URLs', () => {
      expect(service.isIpfsUrl('https://example.com/metadata.json')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(service.isIpfsUrl('')).toBe(false);
    });
  });

  describe('toGatewayUrl', () => {
    it('should convert IPFS URI to gateway URL', () => {
      const uri = 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const gatewayUrl = service.toGatewayUrl(uri);
      expect(gatewayUrl).toContain('QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      expect(gatewayUrl).toMatch(/^https?:\/\//);
    });

    it('should return non-IPFS URLs as-is', () => {
      const uri = 'https://example.com/metadata.json';
      const gatewayUrl = service.toGatewayUrl(uri);
      expect(gatewayUrl).toBe(uri);
    });
  });
});
