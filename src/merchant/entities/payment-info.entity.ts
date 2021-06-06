import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DriverPaymentInfo } from '../../deliver/entities';
import { PayPalPayment } from './paypal-payment.entity';

@Entity('payment_info')
export class PaymentInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PayPalPayment, { cascade: ['insert', 'update'], eager: true })
  @JoinColumn()
  paypal: PayPalPayment;

  @OneToOne(
    () => DriverPaymentInfo,
    (driverPaymentInfo) => driverPaymentInfo.paymentInfo,
  )
  driverPaymentInfo: DriverPaymentInfo;
}
