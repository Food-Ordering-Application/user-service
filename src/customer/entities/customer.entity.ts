import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  imageUrl: string;
}
