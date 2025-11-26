export interface ContractMetadata {
  name: string | null;
  symbol: string | null;
  totalSupply: string | null;
  contractType: 'ERC721' | 'ERC1155' | 'UNKNOWN';
}

export interface TokenUriResult {
  tokenUri: string;
  contractAddress: string;
  tokenId: string;
  chain: string;
}

export interface IBlockchainService {
  /**
   * Get contract metadata (name, symbol, totalSupply)
   */
  getContractMetadata(contractAddress: string): Promise<ContractMetadata>;

  /**
   * Get tokenURI for a specific token
   */
  getTokenUri(contractAddress: string, tokenId: string): Promise<string>;

  /**
   * Check if contract is ERC721
   */
  isERC721(contractAddress: string): Promise<boolean>;

  /**
   * Check if contract is ERC1155
   */
  isERC1155(contractAddress: string): Promise<boolean>;

  /**
   * Get chain name
   */
  getChainName(): string;
}
