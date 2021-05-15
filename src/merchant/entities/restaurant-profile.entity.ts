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
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';

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

  @Column({ nullable: false })
  area: string;

  @Column({ nullable: false })
  city: string;

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
}
