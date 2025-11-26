import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetNftParams {
  @ApiProperty({
    description: 'Blockchain network',
    example: 'ethereum',
    enum: ['ethereum', 'polygon', 'starknet'],
  })
  @IsString()
  @IsNotEmpty()
  chain!: string;

  @ApiProperty({
    description: 'NFT contract address',
    example: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  })
  @IsString()
  @IsNotEmpty()
  contractAddress!: string;

  @ApiProperty({
    description: 'Token ID',
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  tokenId!: string;
}

export class GetNftQuery {
  @ApiPropertyOptional({
    description: 'Force refresh from blockchain, bypassing cache',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  refresh?: boolean;
}

export class GetCollectionParams {
  @ApiProperty({
    description: 'Blockchain network',
    example: 'ethereum',
    enum: ['ethereum', 'polygon', 'starknet'],
  })
  @IsString()
  @IsNotEmpty()
  chain!: string;

  @ApiProperty({
    description: 'NFT contract address',
    example: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  })
  @IsString()
  @IsNotEmpty()
  contractAddress!: string;
}
