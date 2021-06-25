import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rating } from '../enums';
import { FeedbackReason } from './feedback-reason.entity';

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

  @ManyToMany(() => FeedbackReason, (reason) => reason.restaurantFeedbacks)
  @JoinTable({
    name: 'restaurant_feedback_reasons',
  })
  reasons: FeedbackReason[];
}
