import { FeedbackController } from './feedback.controller';
import { DriverFeedback } from './entities/driver-feedback.entity';
import { RestaurantFeedback } from './entities/restaurant-feedback.entity';
import { FeedbackReason } from './entities/feedback-reason.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RESTAURANT_SERVICE } from 'src/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FeedbackService } from './feedback.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedbackReason,
      RestaurantFeedback,
      DriverFeedback,
    ]),
    ClientsModule.registerAsync([
      {
        name: RESTAURANT_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('AMQP_URL') as string],
            queue: configService.get('RESTAURANT_AMQP_QUEUE'),
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
