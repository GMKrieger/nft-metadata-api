export interface CacheKeyOptions {
  chain: string;
  contractAddress: string;
  tokenId: string;
}

export interface CacheStats {
  redisHits: number;
  redisMisses: number;
  dbHits: number;
  dbMisses: number;
  totalRequests: number;
  hitRate: number;
}

export interface CachedNftData {
  contractAddress: string;
  tokenId: string;
  chain: string;
  name: string | null;
  description: string | null;
  image: string | null;
  imageUrl: string | null;
  animationUrl: string | null;
  externalUrl: string | null;
  attributes: any[] | null;
  tokenUri: string | null;
  rawMetadata: Record<string, any> | null;
}
