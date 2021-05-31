import { Module } from '@nestjs/common';
import { DeliverService } from './deliver.service';
import { DeliverController } from './deliver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AccountTransaction,
  AccountWallet,
  DeliveryHistory,
  Driver,
  DriverPayment,
  DriverPaymentInfo,
} from './entities';
import { PaymentInfo, PayPalPayment } from '../merchant/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Driver,
      AccountWallet,
      AccountTransaction,
      DeliveryHistory,
      DriverPayment,
      PayPalPayment,
      PaymentInfo,
      DriverPaymentInfo,
    ]),
  ],
  controllers: [DeliverController],
  providers: [DeliverService],
  exports: [DeliverService],
})
export class DeliverModule {}
