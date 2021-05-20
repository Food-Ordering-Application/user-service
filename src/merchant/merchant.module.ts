import {
  Payment,
  PayPalPayment,
  Merchant,
  RestaurantProfile,
} from './entities';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RESTAURANT_SERVICE } from './../constants';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merchant,
      RestaurantProfile,
      Payment,
      PayPalPayment,
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
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
