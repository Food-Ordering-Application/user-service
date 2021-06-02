import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EDriverTransactionType } from '../enums';
import { Driver } from './driver.entity';
import { PayinTransaction } from './payin-transaction.entity';
import { WithdrawTransaction } from './withdraw-transaction.entity';

@Entity()
export class DriverTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: EDriverTransactionType })
  type: string;

  @Column()
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.driverTransactions)
  driver: Driver;

  @OneToOne(
    () => WithdrawTransaction,
    (withdrawTransaction) => withdrawTransaction.driverTransaction,
  )
  withdrawTransaction: WithdrawTransaction;

  @OneToOne(
    () => PayinTransaction,
    (payinTransaction) => payinTransaction.driverTransaction,
  )
  payinTransaction: PayinTransaction;
}
