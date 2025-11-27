export interface NftMetadata {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: NftAttribute[];
  [key: string]: any; // Allow additional properties
}

export interface NftAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface ParsedMetadata {
  name: string | null;
  description: string | null;
  image: string | null;
  imageUrl: string | null;
  animationUrl: string | null;
  externalUrl: string | null;
  attributes: NftAttribute[] | null;
  rawMetadata: Record<string, any>;
}
