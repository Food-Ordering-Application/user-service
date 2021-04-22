import { hash } from "../../shared/helper";
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Merchant } from "./merchant.entity";

@Entity()
export class RestaurantProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.profiles)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column()
  merchantId: string;

  @Column({ nullable: false, unique: true })
  restaurantId: string;

  @Column({ nullable: true, unique: true, default: null })
  posAppKey: string;
}
