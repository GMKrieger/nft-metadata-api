import { Injectable, Logger } from '@nestjs/common';
import { IpfsService } from './ipfs.service';
import { NftMetadata, ParsedMetadata, NftAttribute } from './interfaces/metadata.interface';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(private readonly ipfsService: IpfsService) {}

  /**
   * Fetch and parse NFT metadata from tokenURI
   */
  async fetchMetadata(tokenUri: string): Promise<ParsedMetadata> {
    try {
      this.logger.debug(`Fetching metadata from: ${tokenUri}`);

      // Fetch raw metadata from IPFS or HTTP
      const rawContent = await this.fetchRawMetadata(tokenUri);

      // Parse JSON
      const metadata = this.parseJson(rawContent);

      // Validate and normalize
      const parsed = this.parseAndValidateMetadata(metadata);

      this.logger.debug(`Successfully parsed metadata for tokenURI: ${tokenUri}`);
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to fetch metadata from ${tokenUri}:`, error);
      throw new Error(`Failed to fetch metadata: ${error}`);
    }
  }

  /**
   * Fetch raw metadata content
   */
  private async fetchRawMetadata(tokenUri: string): Promise<string> {
    // Check if it's an IPFS URL
    if (this.ipfsService.isIpfsUrl(tokenUri)) {
      return this.ipfsService.fetchFromIpfs(tokenUri);
    }

    // Handle data URIs (base64 encoded JSON)
    if (tokenUri.startsWith('data:application/json')) {
      return this.parseDataUri(tokenUri);
    }

    // Regular HTTP(S) URL
    if (tokenUri.startsWith('http://') || tokenUri.startsWith('https://')) {
      return this.ipfsService.fetchFromIpfs(tokenUri); // Uses the retry logic
    }

    throw new Error(`Unsupported tokenURI format: ${tokenUri}`);
  }

  /**
   * Parse data URI (base64 encoded)
   */
  private parseDataUri(dataUri: string): string {
    try {
      // Extract the base64 content
      const base64Regex = /^data:application\/json;base64,(.+)$/;
      const match = dataUri.match(base64Regex);

      if (match) {
        return Buffer.from(match[1], 'base64').toString('utf-8');
      }

      // Try plain JSON in data URI
      const jsonRegex = /^data:application\/json,(.+)$/;
      const jsonMatch = dataUri.match(jsonRegex);

      if (jsonMatch) {
        return decodeURIComponent(jsonMatch[1]);
      }

      throw new Error('Invalid data URI format');
    } catch (error) {
      throw new Error(`Failed to parse data URI: ${error}`);
    }
  }

  /**
   * Parse JSON string safely
   */
  private parseJson(content: string): NftMetadata {
    try {
      const parsed = JSON.parse(content);

      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Metadata is not a valid JSON object');
      }

      return parsed as NftMetadata;
    } catch (error) {
      this.logger.error('Failed to parse JSON:', error);
      throw new Error(`Invalid JSON metadata: ${error}`);
    }
  }

  /**
   * Parse and validate metadata structure
   */
  private parseAndValidateMetadata(metadata: NftMetadata): ParsedMetadata {
    // Extract and normalize fields
    const name = this.extractString(metadata.name);
    const description = this.extractString(metadata.description);
    const image = this.extractString(metadata.image);
    const animationUrl = this.extractString(metadata.animation_url);
    const externalUrl = this.extractString(metadata.external_url);

    // Process image URL (convert IPFS to gateway URL)
    let imageUrl: string | null = null;
    if (image) {
      imageUrl = this.ipfsService.isIpfsUrl(image)
        ? this.ipfsService.normalizeIpfsUri(image)
        : image;
    }

    // Parse attributes
    const attributes = this.parseAttributes(metadata.attributes);

    return {
      name,
      description,
      image,
      imageUrl,
      animationUrl,
      externalUrl,
      attributes,
      rawMetadata: metadata,
    };
  }

  /**
   * Extract string value safely
   */
  private extractString(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim() || null;
    }

    // Convert other types to string
    return String(value).trim() || null;
  }

  /**
   * Parse and validate attributes array
   */
  private parseAttributes(attributes: any): NftAttribute[] | null {
    if (!Array.isArray(attributes)) {
      return null;
    }

    try {
      const parsed: NftAttribute[] = [];

      for (const attr of attributes) {
        if (typeof attr !== 'object' || attr === null) {
          continue;
        }

        const traitType = this.extractString(attr.trait_type);
        const value = attr.value;

        if (!traitType || (value === null || value === undefined)) {
          continue;
        }

        const attribute: NftAttribute = {
          trait_type: traitType,
          value: typeof value === 'string' || typeof value === 'number' ? value : String(value),
        };

        if (attr.display_type) {
          attribute.display_type = this.extractString(attr.display_type) || undefined;
        }

        parsed.push(attribute);
      }

      return parsed.length > 0 ? parsed : null;
    } catch (error) {
      this.logger.warn('Failed to parse attributes:', error);
      return null;
    }
  }

  /**
   * Validate if metadata is well-formed
   */
  validateMetadata(metadata: ParsedMetadata): boolean {
    // At minimum, metadata should have a name or image
    return !!(metadata.name || metadata.image);
  }
}
