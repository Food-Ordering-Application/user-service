import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DriverPayment } from '../../deliver/entities';
import { PayPalPayment } from './paypal-payment.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PayPalPayment, { cascade: ['insert', 'update'], eager: true })
  @JoinColumn()
  paypal: PayPalPayment;

  @OneToOne(() => DriverPayment, (driverPayment) => driverPayment.payment)
  driverPayment: DriverPayment;
}
