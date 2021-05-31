import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EDriverPaymentStatus } from '../enums';
import { Driver } from './driver.entity';

@Entity()
export class DriverPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: EDriverPaymentStatus })
  status: string;

  @Column()
  amount: number;

  @Column({ nullable: true })
  captureId: string;

  @Column({ nullable: true })
  paypalOrderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.driverPayments)
  driver: Driver;
}
