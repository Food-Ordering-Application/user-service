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

  @Column()
  latitude: string;

  @Column()
  longtitude: string;
}
