import { Module } from '@nestjs/common';
import { DeliverService } from './deliver.service';
import { DeliverController } from './deliver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Driver])],
  controllers: [DeliverController],
  providers: [DeliverService],
})
export class DeliverModule {}
