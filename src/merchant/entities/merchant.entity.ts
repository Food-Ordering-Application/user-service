import { Staff } from './../../staff/entities/staff.entity';
import { hash } from '../../shared/helper';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RestaurantProfile } from './restaurant-profile.entity';

@Entity()
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: false })
  fullName: string;

  @Column({ nullable: false })
  IDNumber: string;

  @Column({ nullable: true })
  verificationCode: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @OneToMany(
    () => RestaurantProfile,
    (restaurantProfile) => restaurantProfile.merchantId,
  )
  profiles: RestaurantProfile[];

  @OneToMany(() => Staff, (staff) => staff.merchant)
  staffs: Staff[];

  private beforeUpdatePassword: string;
  @AfterLoad()
  private loadTempPassword(): void {
    this.beforeUpdatePassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // new password is null and old password not null => password is removed
    if (this.password != this.beforeUpdatePassword) {
      if (this.password != null) {
        this.password = await hash(this.password);
      } else {
        this.password = this.beforeUpdatePassword;
        return;
      }
    }
  }
}
