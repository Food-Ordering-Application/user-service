import { Column, Entity, Index, ManyToMany, PrimaryColumn } from 'typeorm';
import { DriverFeedback } from '.';
import { FeedbackType, Rating } from '../enums';
import { RestaurantFeedback } from './restaurant-feedback.entity';

@Entity()
export class FeedbackReason {
  @PrimaryColumn()
  id: number;

  @Column({ nullable: false })
  content: string;

  @Column({ nullable: false })
  @Index()
  type: FeedbackType;

  @Column({ nullable: false })
  displayOrder: number;

  @Column({ nullable: false })
  rate: Rating;

  @ManyToMany(() => RestaurantFeedback, (feedback) => feedback.reasons)
  restaurantFeedbacks: RestaurantFeedback;

  @ManyToMany(() => DriverFeedback, (feedback) => feedback.reasons)
  driverFeedbacks: RestaurantFeedback;
}
