import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class CustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, (customer) => customer.customerAddresses)
  customer: Customer;

  @Column()
  address: string;

  @Column({ default: 'TPHCM' })
  city: string;

  @Column({ default: 'TPHCM' })
  area: string;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  geom: { type: string; coordinates: number[] };
}
