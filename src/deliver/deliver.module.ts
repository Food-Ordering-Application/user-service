import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentInfo, PayPalPayment } from '../merchant/entities';
import { DeliverController } from './deliver.controller';
import { DeliverService } from './deliver.service';
import {
  AccountTransaction,
  AccountWallet,
  DeliveryHistory,
  Driver,
  DriverPaymentInfo,
  DriverTransaction,
  PayinTransaction,
  WithdrawTransaction,
} from './entities';
import { RestaurantTransaction } from './entities/restaurant-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      AccountWallet,
      AccountTransaction,
      DeliveryHistory,
      PayPalPayment,
      PaymentInfo,
      DriverPaymentInfo,
      DriverTransaction,
      PayinTransaction,
      WithdrawTransaction,
      RestaurantTransaction,
    ]),
  ],
  controllers: [DeliverController],
  providers: [DeliverService],
  exports: [DeliverService],
})
export class DeliverModule {}
