// ERC721 Standard Interface
export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

// ERC1155 Standard Interface
export const ERC1155_ABI = [
  'function uri(uint256 tokenId) view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

// ERC165 Interface IDs
export const INTERFACE_IDS = {
  ERC721: '0x80ac58cd',
  ERC1155: '0xd9b67a26',
  ERC721_METADATA: '0x5b5e139f',
};
