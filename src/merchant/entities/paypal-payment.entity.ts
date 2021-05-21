import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

@Entity('paypal_payment')
export class PayPalPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // payments_receivable + primary_email_confirmed + oauth_third_party
  // https://developer.paypal.com/docs/platforms/seller-onboarding/before-payment/#5-track-seller-onboarding-status
  @Column({ default: false })
  isOnboard: boolean;

  @Column({ default: null })
  merchantIdInPayPal: string;
}
