import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1622375525021 implements MigrationInterface {
  name = 'modifyEntity1622375525021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paypalId" uuid, CONSTRAINT "REL_a74bc006a7f4a03464752a0dc4" UNIQUE ("paypalId"), CONSTRAINT "PK_b2ba4f3b3f40c6a37e54fb8b252" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "driver_payment_info" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDefault" boolean NOT NULL DEFAULT false, "driverId" uuid, "paymentInfoId" uuid, CONSTRAINT "REL_616b4adf079810f0c900fe07f3" UNIQUE ("paymentInfoId"), CONSTRAINT "PK_67c52da5a2ffb7505b692312225" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "verifyPhoneNumberOTP"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "isDefault"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "REL_c5127e2e35ff7464b6e425756b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "paymentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "UQ_c5127e2e35ff7464b6e425756b6" UNIQUE ("paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "status" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "amount" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "captureId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "paypalOrderId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "dateOfBirth"`);
    await queryRunner.query(`ALTER TABLE "driver" ADD "dateOfBirth" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_4302a91d2282581cef7c36e8b85" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" ADD CONSTRAINT "FK_a74bc006a7f4a03464752a0dc40" FOREIGN KEY ("paypalId") REFERENCES "paypal_payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_4302a91d2282581cef7c36e8b85" FOREIGN KEY ("paymentId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment_info" ADD CONSTRAINT "FK_f2a271b2621604f1b7b328f94d9" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment_info" ADD CONSTRAINT "FK_616b4adf079810f0c900fe07f31" FOREIGN KEY ("paymentInfoId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver_payment_info" DROP CONSTRAINT "FK_616b4adf079810f0c900fe07f31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment_info" DROP CONSTRAINT "FK_f2a271b2621604f1b7b328f94d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" DROP CONSTRAINT "FK_a74bc006a7f4a03464752a0dc40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_4302a91d2282581cef7c36e8b85"`,
    );
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "dateOfBirth"`);
    await queryRunner.query(
      `ALTER TABLE "driver" ADD "dateOfBirth" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "paypalOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "captureId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "UQ_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "paymentId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP COLUMN "isDefault"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "paymentId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "REL_c5127e2e35ff7464b6e425756b" UNIQUE ("paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "verifyPhoneNumberOTP" character varying`,
    );
    await queryRunner.query(`DROP TABLE "driver_payment_info"`);
    await queryRunner.query(`DROP TABLE "payment_info"`);
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_4302a91d2282581cef7c36e8b85" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
