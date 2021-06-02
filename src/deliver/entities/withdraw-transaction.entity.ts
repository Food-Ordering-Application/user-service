import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EWithdrawTransactionStatus } from '../enums';
import { DriverTransaction } from './driver-transaction.entity';

@Entity()
export class WithdrawTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: EWithdrawTransactionStatus })
  status: string;

  @Column()
  senderBatchId: string;
  @Column()
  senderItemId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  //? Relation
  @OneToOne(
    () => DriverTransaction,
    (driverTransaction) => driverTransaction.withdrawTransaction,
  )
  @JoinColumn()
  driverTransaction: DriverTransaction;
}
