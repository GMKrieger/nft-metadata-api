import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestAnalytics } from './entities/request-analytics.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(RequestAnalytics)
    private readonly analyticsRepository: Repository<RequestAnalytics>,
  ) {}

  /**
   * Track an API request
   */
  async trackRequest(data: {
    endpoint: string;
    chain: string;
    contractAddress?: string;
    tokenId?: string;
    apiKey?: string;
    cacheHit: boolean;
    responseTime: number;
    httpMethod: string;
    statusCode: number;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const analytics = this.analyticsRepository.create({
        endpoint: data.endpoint,
        chain: data.chain,
        contractAddress: data.contractAddress || null,
        tokenId: data.tokenId || null,
        apiKey: data.apiKey ? this.hashApiKey(data.apiKey) : null,
        cacheHit: data.cacheHit,
        responseTime: data.responseTime,
        httpMethod: data.httpMethod,
        statusCode: data.statusCode,
        ipAddress: data.ipAddress || null,
      });

      await this.analyticsRepository.save(analytics);
    } catch (error) {
      this.logger.error('Failed to track request:', error);
      // Don't throw - analytics should not break the main flow
    }
  }

  /**
   * Get analytics for a specific chain
   */
  async getChainStats(chain: string, days: number = 7): Promise<{
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN analytics.cacheHit THEN 1 ELSE 0 END)', 'cacheHits')
      .addSelect('AVG(analytics.responseTime)', 'avgResponseTime')
      .where('analytics.chain = :chain', { chain: chain.toLowerCase() })
      .andWhere('analytics.timestamp >= :since', { since })
      .getRawOne();

    const total = parseInt(result.total, 10) || 0;
    const cacheHits = parseInt(result.cacheHits, 10) || 0;
    const avgResponseTime = parseFloat(result.avgResponseTime) || 0;

    return {
      totalRequests: total,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      averageResponseTime: Math.round(avgResponseTime),
    };
  }

  /**
   * Get overall API statistics
   */
  async getOverallStats(days: number = 7): Promise<{
    totalRequests: number;
    requestsByChain: Record<string, number>;
    cacheHitRate: number;
    averageResponseTime: number;
    requestsByStatus: Record<number, number>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Overall stats
    const overall = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN analytics.cacheHit THEN 1 ELSE 0 END)', 'cacheHits')
      .addSelect('AVG(analytics.responseTime)', 'avgResponseTime')
      .where('analytics.timestamp >= :since', { since })
      .getRawOne();

    // Requests by chain
    const byChain = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.chain', 'chain')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.timestamp >= :since', { since })
      .groupBy('analytics.chain')
      .getRawMany();

    // Requests by status code
    const byStatus = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.statusCode', 'statusCode')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.timestamp >= :since', { since })
      .groupBy('analytics.statusCode')
      .getRawMany();

    const total = parseInt(overall.total, 10) || 0;
    const cacheHits = parseInt(overall.cacheHits, 10) || 0;

    const requestsByChain: Record<string, number> = {};
    byChain.forEach((row) => {
      requestsByChain[row.chain] = parseInt(row.count, 10);
    });

    const requestsByStatus: Record<number, number> = {};
    byStatus.forEach((row) => {
      requestsByStatus[row.statusCode] = parseInt(row.count, 10);
    });

    return {
      totalRequests: total,
      requestsByChain,
      cacheHitRate: total > 0 ? cacheHits / total : 0,
      averageResponseTime: Math.round(parseFloat(overall.avgResponseTime) || 0),
      requestsByStatus,
    };
  }

  /**
   * Hash API key for storage (simple hash for now)
   */
  private hashApiKey(apiKey: string): string {
    // In production, use a proper hashing algorithm (bcrypt, scrypt, etc.)
    // For now, just take first 8 characters as identifier
    return apiKey.substring(0, 8) + '...';
  }
}
