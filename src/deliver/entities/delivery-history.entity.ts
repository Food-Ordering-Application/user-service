import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Driver } from './driver.entity';

@Entity()
export class DeliveryHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  deliveryId: string;
  @Column()
  orderId: string;
  @Column()
  shippingFee: number;
  @Column()
  totalDistance: number;
  @CreateDateColumn()
  createdAt: Date;

  //? Relation
  @ManyToOne(() => Driver, (driver) => driver.deliveryHistories)
  driver: Driver;

  @Column()
  driverId: string;
}
