import { RESTAURANT_EVENT } from './../../../restaurant-service/src/constants';
import { RestaurantProfile } from './entities/restaurant-profile.entity';
import { Merchant } from './entities/merchant.entity';
import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant, RestaurantProfile]),
    ClientsModule.registerAsync([
      {
        name: RESTAURANT_EVENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('AMQP_URL') as string],
            queue: configService.get('RESTAURANT_EVENT_AMQP_QUEUE'),
            queueOptions: {
              durable: false,
            },
          },
        }),
      }
    ])
  ],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService]
})
export class MerchantModule { }
