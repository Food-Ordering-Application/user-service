import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeedbackReason } from '.';
import { Rating } from '../enums';

@Entity()
export class DriverFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  orderId: string;

  @Column({ nullable: false })
  customerId: string;

  @Column({ nullable: false })
  @Index()
  driverId: string;

  @Column({ nullable: true })
  message: string;

  @Column({ nullable: false })
  @Index()
  rate: Rating;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ManyToMany(() => FeedbackReason, (reason) => reason.driverFeedbacks)
  @JoinTable({
    name: 'driver_feedback_reasons',
  })
  reasons: FeedbackReason[];
}
