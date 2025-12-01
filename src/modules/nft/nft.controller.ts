import { Controller, Get, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NftService } from './nft.service';
import { GetNftParams, GetNftQuery, GetCollectionParams } from './dto/get-nft.dto';
import { NftMetadataResponseDto, CollectionMetadataResponseDto } from './dto/nft-response.dto';

@ApiTags('NFT')
@Controller('nft')
export class NftController {
  private readonly logger = new Logger(NftController.name);

  constructor(private readonly nftService: NftService) {}

  @Get(':chain/:contractAddress/:tokenId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get NFT metadata',
    description: 'Fetch NFT metadata from cache or blockchain/IPFS',
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
  @ApiParam({
    name: 'tokenId',
    description: 'Token ID',
  })
  @ApiQuery({
    name: 'refresh',
    required: false,
    type: Boolean,
    description: 'Force refresh from blockchain, bypassing cache',
  })
  @ApiResponse({
    status: 200,
    description: 'NFT metadata retrieved successfully',
    type: NftMetadataResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid chain or parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'NFT not found',
  })
  async getNftMetadata(
    @Param() params: GetNftParams,
    @Query() query: GetNftQuery,
  ): Promise<NftMetadataResponseDto> {
    this.logger.log(
      `GET NFT: ${params.chain}:${params.contractAddress}:${params.tokenId} (refresh: ${query.refresh})`,
    );

    return this.nftService.getNftMetadata(
      params.chain,
      params.contractAddress,
      params.tokenId,
      query.refresh,
    );
  }
}
