import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NftModule } from './modules/nft/nft.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { CacheModule } from './modules/cache/cache.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    NestCacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
          ttl: 3600000, // 1 hour in milliseconds
        }),
      }),
    }),
    BlockchainModule,
    MetadataModule,
    CacheModule,
    AnalyticsModule,
    NftModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
