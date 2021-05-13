import { Module } from '@nestjs/common';
import { DeliverService } from './deliver.service';
import { DeliverController } from './deliver.controller';

@Module({
  controllers: [DeliverController],
  providers: [DeliverService],
})
export class DeliverModule {}
