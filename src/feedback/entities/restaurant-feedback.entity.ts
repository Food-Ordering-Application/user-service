import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rating } from '../enums';

@Entity()
export class RestaurantFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  orderId: string;

  @Column({ nullable: false })
  customerId: string;

  @Column({ nullable: false })
  @Index()
  restaurantId: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: false })
  @Index()
  rate: Rating;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
