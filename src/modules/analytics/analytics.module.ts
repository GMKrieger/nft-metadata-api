import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { RequestAnalytics } from './entities/request-analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestAnalytics])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
