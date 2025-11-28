import { CacheKeyOptions } from './interfaces/cache.interface';

export class CacheKeyUtil {
  private static readonly PREFIX = 'nft';
  private static readonly SEPARATOR = ':';

  /**
   * Generate cache key for NFT metadata
   * Format: nft:{chain}:{contractAddress}:{tokenId}
   */
  static generateNftKey(options: CacheKeyOptions): string {
    const { chain, contractAddress, tokenId } = options;

    // Normalize inputs
    const normalizedChain = chain.toLowerCase();
    const normalizedAddress = contractAddress.toLowerCase();

    return [this.PREFIX, normalizedChain, normalizedAddress, tokenId].join(this.SEPARATOR);
  }

  /**
   * Generate cache key for collection metadata
   * Format: collection:{chain}:{contractAddress}
   */
  static generateCollectionKey(chain: string, contractAddress: string): string {
    const normalizedChain = chain.toLowerCase();
    const normalizedAddress = contractAddress.toLowerCase();

    return ['collection', normalizedChain, normalizedAddress].join(this.SEPARATOR);
  }

  /**
   * Parse NFT cache key back to components
   */
  static parseNftKey(key: string): CacheKeyOptions | null {
    try {
      const parts = key.split(this.SEPARATOR);

      if (parts.length !== 4 || parts[0] !== this.PREFIX) {
        return null;
      }

      return {
        chain: parts[1],
        contractAddress: parts[2],
        tokenId: parts[3],
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate pattern for cache invalidation
   * Example: nft:ethereum:0x* (all NFTs on Ethereum)
   */
  static generatePattern(chain?: string, contractAddress?: string): string {
    const parts = [this.PREFIX];

    if (chain) {
      parts.push(chain.toLowerCase());

      if (contractAddress) {
        parts.push(contractAddress.toLowerCase());
        parts.push('*');
      } else {
        parts.push('*');
      }
    } else {
      parts.push('*');
    }

    return parts.join(this.SEPARATOR);
  }
}
