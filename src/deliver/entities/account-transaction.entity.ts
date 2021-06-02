import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EOperationType } from '../enums';
import { Driver } from './driver.entity';

@Entity()
export class AccountTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  amount: number;
  @Column()
  accountBalance: number;
  @Column({ enum: EOperationType })
  operationType: string;
  @CreateDateColumn()
  createdAt: Date;

  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.accountTransactions)
  driver: Driver;
}
