import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface IpfsGateway {
  name: string;
  url: string;
  priority: number;
}

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly gateways: IpfsGateway[];
  private readonly timeout: number = 5000; // 5 seconds
  private readonly maxRetries: number = 3;

  constructor(private readonly configService: ConfigService) {
    // Initialize axios with timeout
    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Initialize IPFS gateways in priority order
    this.gateways = [
      {
        name: 'Pinata',
        url: 'https://gateway.pinata.cloud',
        priority: 1,
      },
      {
        name: 'IPFS.io',
        url: 'https://ipfs.io',
        priority: 2,
      },
      {
        name: 'Cloudflare',
        url: 'https://cloudflare-ipfs.com',
        priority: 3,
      },
      {
        name: 'Dweb.link',
        url: 'https://dweb.link',
        priority: 4,
      },
    ];

    this.logger.log(`IPFS Service initialized with ${this.gateways.length} gateways`);
  }

  /**
   * Normalize IPFS URI to HTTP URL
   */
  normalizeIpfsUri(uri: string): string {
    if (!uri) {
      throw new Error('URI is required');
    }

    // Already an HTTP(S) URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // Handle ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      return `${this.gateways[0].url}/ipfs/${hash}`;
    }

    // Handle /ipfs/ prefix
    if (uri.startsWith('/ipfs/')) {
      return `${this.gateways[0].url}${uri}`;
    }

    // Assume it's a raw hash
    return `${this.gateways[0].url}/ipfs/${uri}`;
  }

  /**
   * Extract IPFS hash from URI
   */
  extractIpfsHash(uri: string): string | null {
    try {
      // Match IPFS hash pattern (Qm... or baf...)
      const ipfsHashRegex = /(Qm[1-9A-HJ-NP-Za-km-z]{44,}|baf[0-9A-Za-z]{50,})/;
      const match = uri.match(ipfsHashRegex);
      return match ? match[1] : null;
    } catch (error) {
      this.logger.warn(`Failed to extract IPFS hash from ${uri}`);
      return null;
    }
  }

  /**
   * Fetch content from IPFS with gateway fallback
   */
  async fetchFromIpfs(uri: string): Promise<string> {
    const hash = this.extractIpfsHash(uri);

    if (!hash) {
      // If no hash found, try to fetch the URI directly
      this.logger.debug(`No IPFS hash found in ${uri}, attempting direct fetch`);
      return this.fetchWithRetry(uri);
    }

    // Try each gateway in order
    for (const gateway of this.gateways) {
      const gatewayUrl = `${gateway.url}/ipfs/${hash}`;

      try {
        this.logger.debug(`Attempting to fetch from ${gateway.name}: ${gatewayUrl}`);
        const content = await this.fetchWithRetry(gatewayUrl, 2); // Fewer retries per gateway
        this.logger.log(`Successfully fetched from ${gateway.name}`);
        return content;
      } catch (error) {
        this.logger.warn(`Failed to fetch from ${gateway.name}: ${error}`);
        // Continue to next gateway
      }
    }

    throw new Error(`Failed to fetch from IPFS after trying all gateways: ${uri}`);
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(url: string, maxRetries: number = this.maxRetries): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.get(url);

        // Check if response is JSON
        if (typeof response.data === 'string') {
          return response.data;
        }

        return JSON.stringify(response.data);
      } catch (error: any) {
        lastError = error;

        // Don't retry on 404 or client errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw new Error(`Client error ${error.response.status}: ${url}`);
        }

        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        this.logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

        if (attempt < maxRetries - 1) {
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to fetch after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Check if URL is an IPFS URL
   */
  isIpfsUrl(url: string): boolean {
    if (!url) return false;
    return (
      url.startsWith('ipfs://') ||
      url.includes('/ipfs/') ||
      /Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(url) ||
      /baf[0-9A-Za-z]{50,}/.test(url)
    );
  }

  /**
   * Convert IPFS URI to gateway URL for a specific gateway
   */
  toGatewayUrl(uri: string, gatewayIndex: number = 0): string {
    const hash = this.extractIpfsHash(uri);

    if (!hash) {
      return uri;
    }

    const gateway = this.gateways[gatewayIndex] || this.gateways[0];
    return `${gateway.url}/ipfs/${hash}`;
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
