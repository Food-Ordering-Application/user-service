import { hash } from "src/shared/helper";
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
