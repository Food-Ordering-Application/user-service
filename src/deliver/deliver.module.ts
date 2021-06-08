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
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '../constants';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('AMQP_URL') as string],
            queue: configService.get('NOTIFICATION_AMQP_QUEUE'),
            queueOptions: {
              durable: false,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [DeliverController],
  providers: [DeliverService],
  exports: [DeliverService],
})
export class DeliverModule {}
