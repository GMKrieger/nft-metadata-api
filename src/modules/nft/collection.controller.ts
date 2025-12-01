import { Controller, Get, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { DatabaseCacheService } from '../cache/database-cache.service';
import { GetCollectionParams } from './dto/get-nft.dto';
import { CollectionMetadataResponseDto, NftMetadataResponseDto } from './dto/nft-response.dto';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

@ApiTags('Collection')
@Controller('collection')
export class CollectionController {
  private readonly logger = new Logger(CollectionController.name);

  constructor(
    private readonly nftService: NftService,
    private readonly databaseCacheService: DatabaseCacheService,
  ) {}

  @Get(':chain/:contractAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get collection metadata',
    description: 'Fetch NFT collection metadata (name, symbol, totalSupply)',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: ['ethereum', 'polygon', 'starknet'],
  })
  @ApiParam({
    name: 'contractAddress',
    description: 'NFT contract address',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection metadata retrieved successfully',
    type: CollectionMetadataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chain or parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  async getCollectionMetadata(
    @Param() params: GetCollectionParams,
  ): Promise<CollectionMetadataResponseDto> {
    this.logger.log(`GET Collection: ${params.chain}:${params.contractAddress}`);

    return this.nftService.getCollectionMetadata(params.chain, params.contractAddress);
  }

  @Get(':chain/:contractAddress/tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all NFTs in a collection',
    description: 'List all cached NFTs for a collection with pagination',
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network',
    enum: ['ethereum', 'polygon', 'starknet'],
  })
  @ApiParam({
    name: 'contractAddress',
    description: 'NFT contract address',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (1-100)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Collection NFTs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/NftMetadataResponseDto' },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chain or parameters',
  })
  async getCollectionNfts(
    @Param() params: GetCollectionParams,
    @Query() query: PaginationQuery,
  ): Promise<{
    items: NftMetadataResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    this.logger.log(
      `GET Collection NFTs: ${params.chain}:${params.contractAddress} (limit: ${query.limit}, offset: ${query.offset})`,
    );

    const result = await this.databaseCacheService.getCollectionNfts(
      params.chain,
      params.contractAddress,
      query.limit,
      query.offset,
    );

    const items = result.items.map((entity) => ({
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
      cached: true,
      lastUpdated: entity.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return {
      items,
      total: result.total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }
}
