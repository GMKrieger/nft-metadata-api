import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftMetadata } from '../nft/entities/nft-metadata.entity';
import { NftCollection } from '../nft/entities/nft-collection.entity';
import { CacheKeyOptions, CachedNftData } from './interfaces/cache.interface';

@Injectable()
export class DatabaseCacheService {
  private readonly logger = new Logger(DatabaseCacheService.name);

  constructor(
    @InjectRepository(NftMetadata)
    private readonly nftMetadataRepository: Repository<NftMetadata>,
    @InjectRepository(NftCollection)
    private readonly nftCollectionRepository: Repository<NftCollection>,
  ) {}

  /**
   * Get NFT metadata from PostgreSQL
   */
  async getNftMetadata(options: CacheKeyOptions): Promise<NftMetadata | null> {
    try {
      const { chain, contractAddress, tokenId } = options;

      const metadata = await this.nftMetadataRepository.findOne({
        where: {
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
          tokenId,
        },
      });

      if (metadata) {
        this.logger.debug(
          `Database cache HIT for ${chain}:${contractAddress}:${tokenId}`,
        );
      } else {
        this.logger.debug(
          `Database cache MISS for ${chain}:${contractAddress}:${tokenId}`,
        );
      }

      return metadata;
    } catch (error) {
      this.logger.error('Error getting from database cache:', error);
      return null;
    }
  }

  /**
   * Save or update NFT metadata in PostgreSQL
   */
  async setNftMetadata(options: CacheKeyOptions, data: CachedNftData): Promise<void> {
    try {
      const { chain, contractAddress, tokenId } = options;

      // Check if record exists
      const existing = await this.nftMetadataRepository.findOne({
        where: {
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
          tokenId,
        },
      });

      if (existing) {
        // Update existing record
        await this.nftMetadataRepository.update(existing.id, {
          name: data.name,
          description: data.description,
          image: data.image,
          imageUrl: data.imageUrl,
          animationUrl: data.animationUrl,
          externalUrl: data.externalUrl,
          attributes: data.attributes,
          tokenUri: data.tokenUri,
          rawMetadata: data.rawMetadata,
        });

        this.logger.debug(`Updated database cache for ${chain}:${contractAddress}:${tokenId}`);
      } else {
        // Create new record
        const newMetadata = this.nftMetadataRepository.create({
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
          tokenId,
          name: data.name,
          description: data.description,
          image: data.image,
          imageUrl: data.imageUrl,
          animationUrl: data.animationUrl,
          externalUrl: data.externalUrl,
          attributes: data.attributes,
          tokenUri: data.tokenUri,
          rawMetadata: data.rawMetadata,
        });

        await this.nftMetadataRepository.save(newMetadata);
        this.logger.debug(`Saved to database cache: ${chain}:${contractAddress}:${tokenId}`);
      }
    } catch (error) {
      this.logger.error('Error saving to database cache:', error);
    }
  }

  /**
   * Delete NFT metadata from database
   */
  async deleteNftMetadata(options: CacheKeyOptions): Promise<void> {
    try {
      const { chain, contractAddress, tokenId } = options;

      await this.nftMetadataRepository.delete({
        chain: chain.toLowerCase(),
        contractAddress: contractAddress.toLowerCase(),
        tokenId,
      });

      this.logger.debug(`Deleted from database: ${chain}:${contractAddress}:${tokenId}`);
    } catch (error) {
      this.logger.error('Error deleting from database:', error);
    }
  }

  /**
   * Get collection metadata from database
   */
  async getCollectionMetadata(chain: string, contractAddress: string): Promise<NftCollection | null> {
    try {
      const collection = await this.nftCollectionRepository.findOne({
        where: {
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
        },
      });

      if (collection) {
        this.logger.debug(`Database cache HIT for collection ${chain}:${contractAddress}`);
      } else {
        this.logger.debug(`Database cache MISS for collection ${chain}:${contractAddress}`);
      }

      return collection;
    } catch (error) {
      this.logger.error('Error getting collection from database:', error);
      return null;
    }
  }

  /**
   * Save or update collection metadata
   */
  async setCollectionMetadata(
    chain: string,
    contractAddress: string,
    data: {
      name: string | null;
      symbol: string | null;
      totalSupply: string | null;
      contractType: string;
    },
  ): Promise<void> {
    try {
      const existing = await this.nftCollectionRepository.findOne({
        where: {
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
        },
      });

      if (existing) {
        await this.nftCollectionRepository.update(existing.id, {
          name: data.name,
          symbol: data.symbol,
          totalSupply: data.totalSupply,
          contractType: data.contractType,
        });

        this.logger.debug(`Updated collection in database: ${chain}:${contractAddress}`);
      } else {
        const newCollection = this.nftCollectionRepository.create({
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
          name: data.name,
          symbol: data.symbol,
          totalSupply: data.totalSupply,
          contractType: data.contractType,
        });

        await this.nftCollectionRepository.save(newCollection);
        this.logger.debug(`Saved collection to database: ${chain}:${contractAddress}`);
      }
    } catch (error) {
      this.logger.error('Error saving collection to database:', error);
    }
  }

  /**
   * Get all NFTs for a collection (paginated)
   */
  async getCollectionNfts(
    chain: string,
    contractAddress: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ items: NftMetadata[]; total: number }> {
    try {
      const [items, total] = await this.nftMetadataRepository.findAndCount({
        where: {
          chain: chain.toLowerCase(),
          contractAddress: contractAddress.toLowerCase(),
        },
        take: limit,
        skip: offset,
        order: {
          createdAt: 'DESC',
        },
      });

      return { items, total };
    } catch (error) {
      this.logger.error('Error getting collection NFTs:', error);
      return { items: [], total: 0 };
    }
  }

  /**
   * Delete all NFTs for a collection
   */
  async deleteCollectionCache(chain: string, contractAddress: string): Promise<number> {
    try {
      const result = await this.nftMetadataRepository.delete({
        chain: chain.toLowerCase(),
        contractAddress: contractAddress.toLowerCase(),
      });

      const deletedCount = result.affected || 0;
      this.logger.log(`Deleted ${deletedCount} NFTs from collection ${chain}:${contractAddress}`);

      // Also delete collection metadata
      await this.nftCollectionRepository.delete({
        chain: chain.toLowerCase(),
        contractAddress: contractAddress.toLowerCase(),
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('Error deleting collection cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalNfts: number;
    totalCollections: number;
    nftsByChain: Record<string, number>;
  }> {
    try {
      const totalNfts = await this.nftMetadataRepository.count();
      const totalCollections = await this.nftCollectionRepository.count();

      // Get NFT counts by chain
      const chainCounts = await this.nftMetadataRepository
        .createQueryBuilder('nft')
        .select('nft.chain', 'chain')
        .addSelect('COUNT(*)', 'count')
        .groupBy('nft.chain')
        .getRawMany();

      const nftsByChain: Record<string, number> = {};
      chainCounts.forEach((row) => {
        nftsByChain[row.chain] = parseInt(row.count, 10);
      });

      return {
        totalNfts,
        totalCollections,
        nftsByChain,
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        totalNfts: 0,
        totalCollections: 0,
        nftsByChain: {},
      };
    }
  }
}
