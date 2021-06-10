import { hash } from '../../shared/helper';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { PaymentInfo } from './payment-info.entity';

@Entity()
export class RestaurantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.profiles)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @Column({ nullable: false, unique: true })
  restaurantId: string;

  @Column({ nullable: true, unique: true, default: null })
  posAppKey: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: true, default: null })
  image: string;

  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  areaId: number;

  @Column({ nullable: true })
  cityId: number;

  @Column({ nullable: false })
  address: string;

  @Column({ nullable: false })
  @Generated('increment')
  contractId: number;

  @Column({ default: null })
  deviceId: string;

  @Column()
  isActive: boolean;

  @Column()
  isVerified: boolean;

  @Column()
  isBanned: boolean;

  @Column({ default: true })
  isAutoConfirm: boolean;

  @OneToOne(() => PaymentInfo, { cascade: ['insert', 'update'] })
  @JoinColumn()
  paymentInfo: PaymentInfo;
}
