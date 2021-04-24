import { hash } from "../../shared/helper";
import { AfterLoad, BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Merchant } from "src/merchant/entities/merchant.entity";
@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.staffs)
  // @JoinColumn()
  merchant: Merchant;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  IDNumber: string;

  @Column({
    type: 'date',
    nullable: true
  })
  dateOfBirth: Date;

  @DeleteDateColumn()
  deletedAt: Date;

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
