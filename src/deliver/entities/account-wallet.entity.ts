import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Driver } from './driver.entity';

@Entity()
export class AccountWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ default: 0 })
  mainBalance: number;
  @Column({ default: 0 })
  depositBalance: number;
  //? Relation
  @OneToOne(() => Driver, (driver) => driver.wallet)
  driver: Driver;
}
