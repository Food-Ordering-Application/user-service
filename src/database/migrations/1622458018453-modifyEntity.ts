import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1622458018453 implements MigrationInterface {
  name = 'modifyEntity1622458018453';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" RENAME COLUMN "paymentId" TO "paymentInfoId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" RENAME CONSTRAINT "REL_4302a91d2282581cef7c36e8b8" TO "UQ_01cebb5e2c2b565ebc0d7097636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" DROP COLUMN "currentBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "isDefault"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "UQ_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" ADD "mainBalance" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" ADD "depositBalance" integer NOT NULL DEFAULT '0'`,
    );
    // await queryRunner.query(
    //   `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636" FOREIGN KEY ("paymentInfoId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" DROP COLUMN "depositBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" DROP COLUMN "mainBalance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "paymentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "UQ_c5127e2e35ff7464b6e425756b6" UNIQUE ("paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_wallet" ADD "currentBalance" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" RENAME CONSTRAINT "UQ_01cebb5e2c2b565ebc0d7097636" TO "REL_4302a91d2282581cef7c36e8b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" RENAME COLUMN "paymentInfoId" TO "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_4302a91d2282581cef7c36e8b85" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
