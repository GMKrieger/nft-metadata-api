import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { IBlockchainService, ContractMetadata } from './interfaces/blockchain.interface';
import { ERC721_ABI, ERC1155_ABI, INTERFACE_IDS } from './constants/abis';

@Injectable()
export class EthereumService implements IBlockchainService {
  private readonly logger = new Logger(EthereumService.name);
  private readonly provider: ethers.JsonRpcProvider;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('ETHEREUM_RPC_URL');
    if (!rpcUrl) {
      throw new Error('ETHEREUM_RPC_URL is not configured');
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.logger.log('Ethereum provider initialized');
  }

  getChainName(): string {
    return 'ethereum';
  }

  async isERC721(contractAddress: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
      const supportsERC721 = await contract.supportsInterface(INTERFACE_IDS.ERC721);
      return supportsERC721;
    } catch (error) {
      this.logger.warn(`Failed to check ERC721 interface for ${contractAddress}: ${error}`);
      return false;
    }
  }

  async isERC1155(contractAddress: string): Promise<boolean> {
    try {
      const contract = new ethers.Contract(contractAddress, ERC1155_ABI, this.provider);
      const supportsERC1155 = await contract.supportsInterface(INTERFACE_IDS.ERC1155);
      return supportsERC1155;
    } catch (error) {
      this.logger.warn(`Failed to check ERC1155 interface for ${contractAddress}: ${error}`);
      return false;
    }
  }

  async getContractMetadata(contractAddress: string): Promise<ContractMetadata> {
    try {
      // Check if it's ERC721 or ERC1155
      const isERC721 = await this.isERC721(contractAddress);
      const isERC1155 = await this.isERC1155(contractAddress);

      if (!isERC721 && !isERC1155) {
        this.logger.warn(`Contract ${contractAddress} is neither ERC721 nor ERC1155`);
        return {
          name: null,
          symbol: null,
          totalSupply: null,
          contractType: 'UNKNOWN',
        };
      }

      // For ERC721, we can get name, symbol, and totalSupply
      if (isERC721) {
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);

        let name: string | null = null;
        let symbol: string | null = null;
        let totalSupply: string | null = null;

        try {
          name = await contract.name();
        } catch (error) {
          this.logger.warn(`Failed to get name for ${contractAddress}`);
        }

        try {
          symbol = await contract.symbol();
        } catch (error) {
          this.logger.warn(`Failed to get symbol for ${contractAddress}`);
        }

        try {
          const supply = await contract.totalSupply();
          totalSupply = supply.toString();
        } catch (error) {
          this.logger.warn(`Failed to get totalSupply for ${contractAddress}`);
        }

        return {
          name,
          symbol,
          totalSupply,
          contractType: 'ERC721',
        };
      }

      // For ERC1155, metadata is limited
      return {
        name: null,
        symbol: null,
        totalSupply: null,
        contractType: 'ERC1155',
      };
    } catch (error) {
      this.logger.error(`Failed to get contract metadata for ${contractAddress}:`, error);
      throw new Error(`Failed to fetch contract metadata: ${error}`);
    }
  }

  async getTokenUri(contractAddress: string, tokenId: string): Promise<string> {
    try {
      // Try ERC721 first
      const isERC721 = await this.isERC721(contractAddress);

      if (isERC721) {
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
        const tokenUri = await contract.tokenURI(tokenId);
        this.logger.debug(`Retrieved tokenURI for ${contractAddress}:${tokenId}`);
        return tokenUri;
      }

      // Try ERC1155
      const isERC1155 = await this.isERC1155(contractAddress);

      if (isERC1155) {
        const contract = new ethers.Contract(contractAddress, ERC1155_ABI, this.provider);
        const uri = await contract.uri(tokenId);
        this.logger.debug(`Retrieved URI for ERC1155 ${contractAddress}:${tokenId}`);
        return uri;
      }

      throw new Error(`Contract ${contractAddress} is neither ERC721 nor ERC1155`);
    } catch (error) {
      this.logger.error(`Failed to get tokenURI for ${contractAddress}:${tokenId}:`, error);
      throw new Error(`Failed to fetch tokenURI: ${error}`);
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.logger.debug(`Ethereum connection OK. Current block: ${blockNumber}`);
      return true;
    } catch (error) {
      this.logger.error('Ethereum connection failed:', error);
      return false;
    }
  }
}
