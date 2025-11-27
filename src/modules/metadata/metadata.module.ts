import { Module } from '@nestjs/common';
import { IpfsService } from './ipfs.service';
import { MetadataService } from './metadata.service';

@Module({
  providers: [IpfsService, MetadataService],
  exports: [IpfsService, MetadataService],
})
export class MetadataModule {}
