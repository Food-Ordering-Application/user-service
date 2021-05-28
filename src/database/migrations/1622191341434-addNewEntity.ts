import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNewEntity1622191341434 implements MigrationInterface {
  name = 'addNewEntity1622191341434';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "account_wallet" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "currentBalance" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_6a5a63a3982760e9a401804ddc6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "driver_payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDefault" boolean NOT NULL DEFAULT false, "driverId" uuid, "paymentId" uuid, CONSTRAINT "REL_c5127e2e35ff7464b6e425756b" UNIQUE ("paymentId"), CONSTRAINT "PK_7bed9187a03f72878f6e1e6bbf5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "driver" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phoneNumber" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying, "name" character varying, "city" character varying, "dateOfBirth" character varying, "IDNumber" character varying, "identityCardImageUrl" character varying, "driverLicenseImageUrl" character varying, "vehicleRegistrationCertificateImageUrl" character varying, "isVerified" boolean NOT NULL DEFAULT false, "isBanned" boolean NOT NULL DEFAULT false, "walletId" uuid, CONSTRAINT "UQ_f248be80b08997f667b0404c910" UNIQUE ("phoneNumber"), CONSTRAINT "UQ_bb2050b01c92e5eb0ecee4c77fb" UNIQUE ("email"), CONSTRAINT "UQ_c83d7139e454bfd61261ce7a874" UNIQUE ("IDNumber"), CONSTRAINT "UQ_a70a09b2b5c04a68f4f7d26a128" UNIQUE ("identityCardImageUrl"), CONSTRAINT "UQ_23baabfaf7d12ee01a533e4a977" UNIQUE ("driverLicenseImageUrl"), CONSTRAINT "UQ_7dde1d798b07414adda4055db9a" UNIQUE ("vehicleRegistrationCertificateImageUrl"), CONSTRAINT "REL_79f3bfd7867eb47bb89361ab6a" UNIQUE ("walletId"), CONSTRAINT "PK_61de71a8d217d585ecd5ee3d065" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "account_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "accountBalance" integer NOT NULL, "operationType" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "driverId" uuid, CONSTRAINT "PK_eba337658ffe8785716a99dcb92" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "deliveryId" character varying NOT NULL, "orderId" character varying NOT NULL, "shippingFee" integer NOT NULL, "totalDistance" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "driverId" uuid, CONSTRAINT "PK_b51c834c69b23c838f72729960c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_f248be80b08997f667b0404c910"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_bb2050b01c92e5eb0ecee4c77fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_c83d7139e454bfd61261ce7a874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_a70a09b2b5c04a68f4f7d26a128"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_23baabfaf7d12ee01a533e4a977"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "UQ_7dde1d798b07414adda4055db9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "FK_27a1505cc2adba1b56c73c75497" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" ADD CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "FK_79f3bfd7867eb47bb89361ab6a5" FOREIGN KEY ("walletId") REFERENCES "account_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ADD CONSTRAINT "FK_52f0d14f6d3e4f916619b436851" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ADD CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "delivery_history" DROP CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" DROP CONSTRAINT "FK_52f0d14f6d3e4f916619b436851"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" DROP CONSTRAINT "FK_79f3bfd7867eb47bb89361ab6a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "FK_c5127e2e35ff7464b6e425756b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_payment" DROP CONSTRAINT "FK_27a1505cc2adba1b56c73c75497"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_7dde1d798b07414adda4055db9a" UNIQUE ("vehicleRegistrationCertificateImageUrl")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_23baabfaf7d12ee01a533e4a977" UNIQUE ("driverLicenseImageUrl")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_a70a09b2b5c04a68f4f7d26a128" UNIQUE ("identityCardImageUrl")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_c83d7139e454bfd61261ce7a874" UNIQUE ("IDNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_bb2050b01c92e5eb0ecee4c77fb" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD CONSTRAINT "UQ_f248be80b08997f667b0404c910" UNIQUE ("phoneNumber")`,
    );
    await queryRunner.query(`DROP TABLE "delivery_history"`);
    await queryRunner.query(`DROP TABLE "account_transaction"`);
    await queryRunner.query(`DROP TABLE "driver"`);
    await queryRunner.query(`DROP TABLE "driver_payment"`);
    await queryRunner.query(`DROP TABLE "account_wallet"`);
  }
}
