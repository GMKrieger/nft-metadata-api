import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BlockchainFactoryService } from '../blockchain/blockchain-factory.service';
import { MetadataService } from '../metadata/metadata.service';
import { TwoTierCacheService } from '../cache/two-tier-cache.service';
import { NftMetadataResponseDto, CollectionMetadataResponseDto } from './dto/nft-response.dto';
import { NftMetadata } from './entities/nft-metadata.entity';

@Injectable()
export class NftService {
  private readonly logger = new Logger(NftService.name);

  constructor(
    private readonly blockchainFactory: BlockchainFactoryService,
    private readonly metadataService: MetadataService,
    private readonly cacheService: TwoTierCacheService,
  ) {}

  /**
   * Get NFT metadata with full orchestration:
   * 1. Check cache (Redis → PostgreSQL)
   * 2. If miss, fetch from blockchain + IPFS
   * 3. Save to cache
   */
  async getNftMetadata(
    chain: string,
    contractAddress: string,
    tokenId: string,
    refresh: boolean = false,
  ): Promise<NftMetadataResponseDto> {
    const startTime = Date.now();

    try {
      // If not refresh, check cache first
      if (!refresh) {
        const cacheResult = await this.cacheService.getNftMetadata({
          chain,
          contractAddress,
          tokenId,
        });

        if (cacheResult.data) {
          const responseTime = Date.now() - startTime;
          this.logger.log(
            `Cache HIT from ${cacheResult.source} for ${chain}:${contractAddress}:${tokenId} (${responseTime}ms)`,
          );

          return this.entityToResponseDto(cacheResult.data, true);
        }
      }

      // Cache miss or refresh requested - fetch from blockchain + IPFS
      this.logger.log(`Fetching NFT from blockchain: ${chain}:${contractAddress}:${tokenId}`);

      const nftData = await this.fetchFromBlockchain(chain, contractAddress, tokenId);

      // Save to cache
      await this.cacheService.setNftMetadata(
        { chain, contractAddress, tokenId },
        {
          contractAddress: nftData.contractAddress,
          tokenId: nftData.tokenId,
          chain: nftData.chain,
          name: nftData.name,
          description: nftData.description,
          image: nftData.image,
          imageUrl: nftData.imageUrl,
          animationUrl: nftData.animationUrl,
          externalUrl: nftData.externalUrl,
          attributes: nftData.attributes,
          tokenUri: nftData.tokenUri,
          rawMetadata: nftData.rawMetadata,
        },
      );

      const responseTime = Date.now() - startTime;
      this.logger.log(
        `Fetched and cached NFT ${chain}:${contractAddress}:${tokenId} (${responseTime}ms)`,
      );

      return this.entityToResponseDto(nftData, false);
    } catch (error) {
      this.logger.error(
        `Failed to get NFT metadata for ${chain}:${contractAddress}:${tokenId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetch NFT data from blockchain and IPFS
   */
  private async fetchFromBlockchain(
    chain: string,
    contractAddress: string,
    tokenId: string,
  ): Promise<NftMetadata> {
    // Get blockchain service for the chain
    const blockchainService = this.blockchainFactory.getBlockchainService(chain);

    // Get tokenURI from contract
    const tokenUri = await blockchainService.getTokenUri(contractAddress, tokenId);

    if (!tokenUri) {
      throw new NotFoundException('TokenURI not found for this NFT');
    }

    // Fetch and parse metadata from IPFS/HTTP
    const parsedMetadata = await this.metadataService.fetchMetadata(tokenUri);

    // Create entity
    const entity = new NftMetadata();
    entity.chain = chain.toLowerCase();
    entity.contractAddress = contractAddress.toLowerCase();
    entity.tokenId = tokenId;
    entity.name = parsedMetadata.name;
    entity.description = parsedMetadata.description;
    entity.image = parsedMetadata.image;
    entity.imageUrl = parsedMetadata.imageUrl;
    entity.animationUrl = parsedMetadata.animationUrl;
    entity.externalUrl = parsedMetadata.externalUrl;
    entity.attributes = parsedMetadata.attributes;
    entity.tokenUri = tokenUri;
    entity.rawMetadata = parsedMetadata.rawMetadata;

    return entity;
  }

  /**
   * Get collection metadata
   */
  async getCollectionMetadata(
    chain: string,
    contractAddress: string,
  ): Promise<CollectionMetadataResponseDto> {
    try {
      // Check cache first
      const cacheResult = await this.cacheService.getCollectionMetadata(chain, contractAddress);

      if (cacheResult.data) {
        this.logger.log(
          `Cache HIT from ${cacheResult.source} for collection ${chain}:${contractAddress}`,
        );

        return {
          contractAddress: cacheResult.data.contractAddress,
          chain: cacheResult.data.chain,
          name: cacheResult.data.name,
          symbol: cacheResult.data.symbol,
          totalSupply: cacheResult.data.totalSupply,
          contractType: cacheResult.data.contractType || 'UNKNOWN',
          lastUpdated: cacheResult.data.updatedAt?.toISOString() || new Date().toISOString(),
        };
      }

      // Fetch from blockchain
      this.logger.log(`Fetching collection from blockchain: ${chain}:${contractAddress}`);

      const blockchainService = this.blockchainFactory.getBlockchainService(chain);
      const metadata = await blockchainService.getContractMetadata(contractAddress);

      // Save to cache
      await this.cacheService.setCollectionMetadata(chain, contractAddress, {
        name: metadata.name,
        symbol: metadata.symbol,
        totalSupply: metadata.totalSupply,
        contractType: metadata.contractType,
      });

      return {
        contractAddress: contractAddress.toLowerCase(),
        chain: chain.toLowerCase(),
        name: metadata.name,
        symbol: metadata.symbol,
        totalSupply: metadata.totalSupply,
        contractType: metadata.contractType,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get collection metadata for ${chain}:${contractAddress}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Convert entity to response DTO
   */
  private entityToResponseDto(entity: NftMetadata, cached: boolean): NftMetadataResponseDto {
    return {
      contractAddress: entity.contractAddress,
      tokenId: entity.tokenId,
      chain: entity.chain,
      name: entity.name,
      description: entity.description,
      image: entity.image,
      imageUrl: entity.imageUrl,
      animationUrl: entity.animationUrl,
      externalUrl: entity.externalUrl,
      attributes: entity.attributes,
      tokenUri: entity.tokenUri || '',
      cached,
      lastUpdated: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
