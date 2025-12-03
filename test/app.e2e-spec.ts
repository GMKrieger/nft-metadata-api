import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('NFT Metadata API (e2e)', () => {
  let app: INestApplication;
  const apiKey = 'test_api_key_12345678'; // Valid format for testing

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configurations as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/health (GET)', () => {
    it('should return health status without API key (public endpoint)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('services');
        });
    });
  });

  describe('/api/stats (GET)', () => {
    it('should return API statistics', () => {
      return request(app.getHttpServer())
        .get('/api/stats')
        .set('X-API-Key', apiKey)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('cache');
          expect(res.body.cache).toHaveProperty('database');
          expect(res.body.cache).toHaveProperty('redis');
        });
    });

    it('should reject request without API key', () => {
      return request(app.getHttpServer())
        .get('/api/stats')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('API key');
        });
    });
  });

  describe('Authentication', () => {
    it('should accept API key in X-API-Key header', () => {
      return request(app.getHttpServer())
        .get('/api/stats')
        .set('X-API-Key', apiKey)
        .expect(200);
    });

    it('should accept API key in Authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/stats')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
    });

    it('should accept API key in query parameter', () => {
      return request(app.getHttpServer())
        .get(`/api/stats?apiKey=${apiKey}`)
        .expect(200);
    });

    it('should reject invalid API key', () => {
      return request(app.getHttpServer())
        .get('/api/stats')
        .set('X-API-Key', 'short') // Too short
        .expect(401);
    });
  });

  describe('Validation', () => {
    it('should validate chain parameter', () => {
      return request(app.getHttpServer())
        .get('/api/nft/invalid-chain/0xabc/1')
        .set('X-API-Key', apiKey)
        .expect(400);
    });

    it('should handle malformed requests', () => {
      return request(app.getHttpServer())
        .get('/api/nft/ethereum/invalid/address')
        .set('X-API-Key', apiKey)
        .expect((res) => {
          // Should handle gracefully even if contract doesn't exist
          expect([400, 404, 500]).toContain(res.status);
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/api/health')
          .expect(200),
      );

      await Promise.all(requests);
    });
  });
});
