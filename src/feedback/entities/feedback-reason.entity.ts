import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { FeedbackType } from '../enums';

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
}
