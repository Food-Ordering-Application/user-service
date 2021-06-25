import {
  PaymentInfo,
  PayPalPayment,
  Merchant,
  RestaurantProfile,
} from './entities';
import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RESTAURANT_SERVICE } from '../constants';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Merchant,
      RestaurantProfile,
      PaymentInfo,
      PayPalPayment,
    ]),
  ],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
