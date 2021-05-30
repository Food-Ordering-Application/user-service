import {
  RestaurantProfile,
  PaymentInfo,
  PayPalPayment,
} from './../../merchant/entities/';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class addPayment1621501596944 implements MigrationInterface {
  name = 'addPayment1621501596944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "paypal_payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isOnboard" boolean NOT NULL DEFAULT false, "merchantIdInPayPal" character varying, CONSTRAINT "PK_84339a466fb29132dfe4062d099" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paypalId" uuid, CONSTRAINT "REL_f8e185638a9e82d979e54a3f19" UNIQUE ("paypalId"), CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD "paymentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "UQ_4302a91d2282581cef7c36e8b85" UNIQUE ("paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ADD CONSTRAINT "FK_f8e185638a9e82d979e54a3f19d" FOREIGN KEY ("paypalId") REFERENCES "paypal_payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_4302a91d2282581cef7c36e8b85" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    const createNewPayment = () => {
      return queryRunner.manager.create<PaymentInfo>(PaymentInfo, {
        paypal: queryRunner.manager.create(PayPalPayment),
      });
    };
    const oldEntities = await queryRunner.manager.find(RestaurantProfile);
    const newEntities = oldEntities.map((oldEntity) => ({
      ...oldEntity,
      payment: createNewPayment(),
    }));
    await queryRunner.manager.save(RestaurantProfile, newEntities);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment" DROP CONSTRAINT "FK_f8e185638a9e82d979e54a3f19d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "UQ_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(`DROP TABLE "payment"`);
    await queryRunner.query(`DROP TABLE "paypal_payment"`);
  }
}
