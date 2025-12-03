import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global guards (API key authentication and rate limiting)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new ApiKeyGuard(app.get('ConfigService'), reflector),
    new RateLimitGuard(app.get('CACHE_MANAGER'), app.get('ConfigService'), reflector),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NFT Metadata API')
    .setDescription('Multi-Chain NFT Metadata API with IPFS integration')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addServer('http://localhost:3000', 'Development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap();
