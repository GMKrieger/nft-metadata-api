import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcProvider, Contract, uint256 } from 'starknet';
import { IBlockchainService, ContractMetadata } from './interfaces/blockchain.interface';

// Basic ERC721 Cairo ABI for Starknet
const STARKNET_ERC721_ABI = [
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'name', type: 'felt' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'felt' }],
    stateMutability: 'view',
  },
  {
    name: 'tokenURI',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'Uint256' }],
    outputs: [{ name: 'tokenURI', type: 'felt' }],
    stateMutability: 'view',
  },
  {
    name: 'token_uri',
    type: 'function',
    inputs: [{ name: 'token_id', type: 'Uint256' }],
    outputs: [{ name: 'token_uri', type: 'felt' }],
    stateMutability: 'view',
  },
];

@Injectable()
export class StarknetService implements IBlockchainService {
  private readonly logger = new Logger(StarknetService.name);
  private readonly provider: RpcProvider;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('STARKNET_RPC_URL');
    if (!rpcUrl) {
      throw new Error('STARKNET_RPC_URL is not configured');
    }
    this.provider = new RpcProvider({ nodeUrl: rpcUrl });
    this.logger.log('Starknet provider initialized');
  }

  getChainName(): string {
    return 'starknet';
  }

  async isERC721(contractAddress: string): Promise<boolean> {
    try {
      // For Starknet, we try to call name() or symbol() to check if it's an ERC721
      const contract = new Contract(STARKNET_ERC721_ABI, contractAddress, this.provider);
      await contract.name();
      return true;
    } catch (error) {
      this.logger.warn(`Contract ${contractAddress} may not be ERC721: ${error}`);
      return false;
    }
  }

  async isERC1155(contractAddress: string): Promise<boolean> {
    // ERC1155 support on Starknet is limited
    // For now, we'll return false and focus on ERC721
    return false;
  }

  async getContractMetadata(contractAddress: string): Promise<ContractMetadata> {
    try {
      const contract = new Contract(STARKNET_ERC721_ABI, contractAddress, this.provider);

      let name: string | null = null;
      let symbol: string | null = null;

      // Try to get name
      try {
        const nameResult = await contract.name();
        // Convert felt to string
        name = this.feltToString(nameResult);
      } catch (error) {
        this.logger.warn(`Failed to get name for ${contractAddress}: ${error}`);
      }

      // Try to get symbol
      try {
        const symbolResult = await contract.symbol();
        // Convert felt to string
        symbol = this.feltToString(symbolResult);
      } catch (error) {
        this.logger.warn(`Failed to get symbol for ${contractAddress}: ${error}`);
      }

      return {
        name,
        symbol,
        totalSupply: null, // Starknet ERC721 may not have totalSupply
        contractType: 'ERC721',
      };
    } catch (error) {
      this.logger.error(`Failed to get contract metadata for ${contractAddress}:`, error);
      return {
        name: null,
        symbol: null,
        totalSupply: null,
        contractType: 'UNKNOWN',
      };
    }
  }

  async getTokenUri(contractAddress: string, tokenId: string): Promise<string> {
    try {
      const contract = new Contract(STARKNET_ERC721_ABI, contractAddress, this.provider);

      // Convert tokenId to Uint256 format (Starknet uses low/high format)
      const tokenIdUint256 = uint256.bnToUint256(BigInt(tokenId));

      let tokenUri: string | null = null;

      // Try tokenURI first (camelCase)
      try {
        const result = await contract.tokenURI(tokenIdUint256);
        tokenUri = this.feltToString(result);
      } catch (error) {
        this.logger.debug(`tokenURI call failed, trying token_uri: ${error}`);
      }

      // Try token_uri (snake_case) if camelCase failed
      if (!tokenUri) {
        try {
          const result = await contract.token_uri(tokenIdUint256);
          tokenUri = this.feltToString(result);
        } catch (error) {
          this.logger.warn(`Both tokenURI and token_uri calls failed for ${contractAddress}`);
          throw error;
        }
      }

      if (!tokenUri) {
        throw new Error('Failed to retrieve tokenURI from contract');
      }

      this.logger.debug(`Retrieved tokenURI for ${contractAddress}:${tokenId}`);
      return tokenUri;
    } catch (error) {
      this.logger.error(`Failed to get tokenURI for ${contractAddress}:${tokenId}:`, error);
      throw new Error(`Failed to fetch tokenURI: ${error}`);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.debug(`Starknet connection OK. Current block: ${blockNumber}`);
      return true;
    } catch (error) {
      this.logger.error('Starknet connection failed:', error);
      return false;
    }
  }

  /**
   * Helper method to convert Starknet felt to string
   * Handles both single felt values and arrays of felts
   */
  private feltToString(felt: any): string {
    try {
      if (typeof felt === 'string') {
        return felt;
      }

      if (typeof felt === 'bigint' || typeof felt === 'number') {
        // Convert felt number to hex and then to ASCII
        const hex = BigInt(felt).toString(16);
        return Buffer.from(hex.padStart(hex.length + (hex.length % 2), '0'), 'hex').toString(
          'utf8',
        );
      }

      if (Array.isArray(felt)) {
        // If it's an array of felts, concatenate them
        return felt
          .map((f) => {
            const hex = BigInt(f).toString(16);
            return Buffer.from(hex.padStart(hex.length + (hex.length % 2), '0'), 'hex').toString(
              'utf8',
            );
          })
          .join('');
      }

      // Fallback: return string representation
      return String(felt);
    } catch (error) {
      this.logger.warn(`Failed to convert felt to string: ${error}`);
      return String(felt);
    }
  }
}
