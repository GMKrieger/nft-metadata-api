import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NftAttributeDto {
  @ApiProperty({ example: 'Background' })
  trait_type!: string;

  @ApiProperty({ example: 'Blue' })
  value!: string | number;

  @ApiPropertyOptional({ example: 'string' })
  display_type?: string;
}

export class NftMetadataResponseDto {
  @ApiProperty({ example: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
  contractAddress!: string;

  @ApiProperty({ example: '1' })
  tokenId!: string;

  @ApiProperty({ example: 'ethereum' })
  chain!: string;

  @ApiPropertyOptional({ example: 'Bored Ape #1' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'A unique Bored Ape NFT' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'ipfs://QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ' })
  image?: string | null;

  @ApiPropertyOptional({ example: 'https://gateway.pinata.cloud/ipfs/QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ' })
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'ipfs://QmAnimation...' })
  animationUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://boredapeyachtclub.com/1' })
  externalUrl?: string | null;

  @ApiPropertyOptional({ type: [NftAttributeDto] })
  attributes?: NftAttributeDto[] | null;

  @ApiProperty({ example: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1' })
  tokenUri!: string;

  @ApiProperty({ example: true })
  cached!: boolean;

  @ApiProperty({ example: '2025-01-26T10:30:00.000Z' })
  lastUpdated!: string;
}

export class CollectionMetadataResponseDto {
  @ApiProperty({ example: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' })
  contractAddress!: string;

  @ApiProperty({ example: 'ethereum' })
  chain!: string;

  @ApiPropertyOptional({ example: 'BoredApeYachtClub' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'BAYC' })
  symbol?: string | null;

  @ApiPropertyOptional({ example: '10000' })
  totalSupply?: string | null;

  @ApiProperty({ example: 'ERC721' })
  contractType!: string;

  @ApiProperty({ example: '2025-01-26T10:30:00.000Z' })
  lastUpdated!: string;
}
