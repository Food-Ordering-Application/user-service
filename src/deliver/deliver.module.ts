import { Module } from '@nestjs/common';
import { DeliverService } from './deliver.service';
import { DeliverController } from './deliver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PaymentInfo, PayPalPayment } from '../merchant/entities';

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
    ]),
  ],
  controllers: [DeliverController],
  providers: [DeliverService],
  exports: [DeliverService],
})
export class DeliverModule {}
