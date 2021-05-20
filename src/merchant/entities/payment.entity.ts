import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PayPalPayment } from './paypal-payment.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PayPalPayment, { cascade: ['insert', 'update'] })
  @JoinColumn()
  paypal: PayPalPayment;
}
