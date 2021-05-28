import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from '../../merchant/entities';
import { Driver } from './driver.entity';

@Entity()
export class DriverPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ default: false })
  isDefault?: boolean;
  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.driverPayments)
  driver: Driver;

  @OneToOne(() => Payment, (payment) => payment.driverPayment)
  @JoinColumn()
  payment: Payment;
}
