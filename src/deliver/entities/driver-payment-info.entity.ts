import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentInfo } from '../../merchant/entities';
import { Driver } from './driver.entity';

@Entity()
export class DriverPaymentInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ default: false })
  isDefault?: boolean;
  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.driverPaymentInfos)
  driver: Driver;

  @OneToOne(() => PaymentInfo, (paymentInfo) => paymentInfo.driverPaymentInfo)
  @JoinColumn()
  paymentInfo: PaymentInfo;
}
