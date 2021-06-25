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
