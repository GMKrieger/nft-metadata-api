import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'System health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-01-26T10:30:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        services: {
          type: 'object',
          properties: {
            redis: { type: 'string', example: 'healthy' },
            ethereum: { type: 'string', example: 'healthy' },
            polygon: { type: 'string', example: 'healthy' },
            starknet: { type: 'string', example: 'healthy' },
          },
        },
      },
    },
  })
  async getHealth() {
    return this.appService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get API statistics' })
  @ApiResponse({
    status: 200,
    description: 'API usage statistics',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        cache: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                totalNfts: { type: 'number' },
                totalCollections: { type: 'number' },
                nftsByChain: { type: 'object' },
              },
            },
            redis: {
              type: 'object',
              properties: {
                healthy: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  })
  async getStats() {
    return this.appService.getStats();
  }
}
