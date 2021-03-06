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
import { CustomerAddress } from './customer-address.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ default: false })
  isPhoneNumberVerified: boolean;

  @Column({ nullable: true })
  sessionInfo: string;

  @Column({ nullable: true })
  verifyEmailToken: string;
  @Column({ nullable: true, type: 'bigint' })
  verifyEmailTokenExpiration: number;
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  resetPasswordToken: string;
  // Thời gian token reset mật khẩu hết tác dụng
  @Column({ nullable: true, type: 'bigint' })
  resetPasswordTokenExpiration: number;

  @Column({ nullable: true, default: false })
  isBanned: boolean;
  @OneToMany(
    () => CustomerAddress,
    (customerAddress) => customerAddress.customer,
  )
  customerAddresses: CustomerAddress[];

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
