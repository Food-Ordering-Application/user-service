import { DeliverModule } from './../deliver/deliver.module';
import { FeedbackController } from './feedback.controller';
import { DriverFeedback } from './entities/driver-feedback.entity';
import { RestaurantFeedback } from './entities/restaurant-feedback.entity';
import { FeedbackReason } from './entities/feedback-reason.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ORDER_SERVICE, RESTAURANT_SERVICE } from 'src/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FeedbackService } from './feedback.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    DeliverModule,
    TypeOrmModule.forFeature([
      FeedbackReason,
      RestaurantFeedback,
      DriverFeedback,
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
