import { CacheKeyUtil } from './cache-key.util';

describe('CacheKeyUtil', () => {
  describe('generateNftKey', () => {
    it('should generate correct cache key format', () => {
      const key = CacheKeyUtil.generateNftKey({
        chain: 'ethereum',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenId: '1',
      });

      expect(key).toBe('nft:ethereum:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d:1');
    });

    it('should normalize chain and address to lowercase', () => {
      const key = CacheKeyUtil.generateNftKey({
        chain: 'ETHEREUM',
        contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenId: '42',
      });

      expect(key).toBe('nft:ethereum:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d:42');
    });
  });

  describe('generateCollectionKey', () => {
    it('should generate correct collection key format', () => {
      const key = CacheKeyUtil.generateCollectionKey(
        'polygon',
        '0x1234567890123456789012345678901234567890',
      );

      expect(key).toBe('collection:polygon:0x1234567890123456789012345678901234567890');
    });

    it('should normalize inputs to lowercase', () => {
      const key = CacheKeyUtil.generateCollectionKey(
        'POLYGON',
        '0xABCDEF1234567890123456789012345678901234',
      );

      expect(key).toBe('collection:polygon:0xabcdef1234567890123456789012345678901234');
    });
  });

  describe('parseNftKey', () => {
    it('should parse valid NFT key', () => {
      const key = 'nft:ethereum:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d:1';
      const parsed = CacheKeyUtil.parseNftKey(key);

      expect(parsed).toEqual({
        chain: 'ethereum',
        contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        tokenId: '1',
      });
    });

    it('should return null for invalid key format', () => {
      const invalidKeys = [
        'invalid:key',
        'nft:ethereum:0xaddress', // Missing tokenId
        'collection:ethereum:0xaddress',
        '',
      ];

      invalidKeys.forEach((key) => {
        expect(CacheKeyUtil.parseNftKey(key)).toBeNull();
      });
    });
  });

  describe('generatePattern', () => {
    it('should generate pattern for all NFTs', () => {
      const pattern = CacheKeyUtil.generatePattern();
      expect(pattern).toBe('nft:*');
    });

    it('should generate pattern for specific chain', () => {
      const pattern = CacheKeyUtil.generatePattern('ethereum');
      expect(pattern).toBe('nft:ethereum:*');
    });

    it('should generate pattern for specific contract', () => {
      const pattern = CacheKeyUtil.generatePattern('ethereum', '0xABC');
      expect(pattern).toBe('nft:ethereum:0xabc:*');
    });

    it('should normalize chain and address', () => {
      const pattern = CacheKeyUtil.generatePattern('ETHEREUM', '0xABCDEF');
      expect(pattern).toBe('nft:ethereum:0xabcdef:*');
    });
  });
});
