import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EPayinTransactionStatus } from '../enums';
import { DriverTransaction } from './driver-transaction.entity';

@Entity()
export class PayinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: EPayinTransactionStatus })
  status: string;

  @Column({ nullable: true })
  captureId: string;

  @Column({ nullable: true })
  paypalOrderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  //? Relation
  @OneToOne(
    () => DriverTransaction,
    (driverTransaction) => driverTransaction.payinTransaction,
  )
  @JoinColumn()
  driverTransaction: DriverTransaction;
}
