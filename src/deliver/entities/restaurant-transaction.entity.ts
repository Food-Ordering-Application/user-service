import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ERestaurantTransactionType } from '../enums';

@Entity()
export class RestaurantTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  restaurantId: string;
  @Column()
  amount: number;
  @Column({ enum: ERestaurantTransactionType })
  type: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
