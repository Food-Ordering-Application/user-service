import { RestaurantFeedback } from './restaurant-feedback.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeedbackType } from '../enums';
import { DriverFeedback } from '.';

@Entity()
export class FeedbackReason {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: false })
  content: string;

  @Column({ nullable: false })
  @Index()
  type: FeedbackType;

  @Column({ nullable: false })
  displayOrder: number;

  @ManyToMany(() => RestaurantFeedback, (feedback) => feedback.reasons)
  restaurantFeedbacks: RestaurantFeedback;

  @ManyToMany(() => DriverFeedback, (feedback) => feedback.reasons)
  driverFeedbacks: RestaurantFeedback;
}
