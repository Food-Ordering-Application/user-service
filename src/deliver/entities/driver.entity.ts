import { hash } from '../../shared/helper';
import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountWallet } from './account-wallet.entity';
import { DriverPaymentInfo } from './driver-payment-info.entity';
import { DeliveryHistory } from './delivery-history.entity';
import { DriverPayment } from './driver-payment.entity';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  phoneNumber?: string;
  @Column()
  password?: string;
  @Column({ nullable: true })
  email?: string;
  @Column({ nullable: true })
  name?: string;
  @Column({ nullable: true })
  city?: string;
  @Column({ nullable: true })
  dateOfBirth?: Date;
  @Column({ nullable: true })
  IDNumber?: string;
  @Column({ nullable: true })
  identityCardImageUrl?: string;
  @Column({ nullable: true })
  driverLicenseImageUrl?: string;
  @Column({ nullable: true })
  vehicleRegistrationCertificateImageUrl?: string;
  @Column({ default: false })
  isVerified?: boolean;
  @Column({ default: false })
  isBanned?: boolean;

  //? Relation
  @OneToOne(() => AccountWallet, (wallet) => wallet.driver)
  @JoinColumn()
  wallet: AccountWallet;

  @OneToMany(
    () => DriverPaymentInfo,
    (driverPaymentInfo) => driverPaymentInfo.driver,
  )
  driverPaymentInfos: DriverPaymentInfo[];

  @OneToMany(() => DriverPayment, (driverPayment) => driverPayment.driver)
  driverPayments: DriverPayment[];

  @OneToMany(() => DeliveryHistory, (deliveryHistory) => deliveryHistory.driver)
  deliveryHistories: DeliveryHistory[];

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
