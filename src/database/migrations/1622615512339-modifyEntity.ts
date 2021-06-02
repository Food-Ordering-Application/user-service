import {MigrationInterface, QueryRunner} from "typeorm";

export class modifyEntity1622615512339 implements MigrationInterface {
    name = 'modifyEntity1622615512339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_profile" DROP CONSTRAINT "restaurant_profile_paymentInfoId_fkey"`);
        await queryRunner.query(`CREATE TABLE "payin_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "captureId" character varying, "paypalOrderId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "driverTransactionId" uuid, CONSTRAINT "REL_0e3cc5667761356fa4b047c194" UNIQUE ("driverTransactionId"), CONSTRAINT "PK_2150bd795dee6bd241127bb3380" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "withdraw_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying NOT NULL, "senderBatchId" character varying NOT NULL, "senderItemId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "driverTransactionId" uuid, CONSTRAINT "REL_1a2a175b3d0e7ce22bdda03a5f" UNIQUE ("driverTransactionId"), CONSTRAINT "PK_88e4076c20ede563a818eda4416" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "driver_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "amount" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "driverId" uuid, CONSTRAINT "PK_909fa3f379909f6e5cd64ba6877" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payin_transaction" ADD CONSTRAINT "FK_0e3cc5667761356fa4b047c1948" FOREIGN KEY ("driverTransactionId") REFERENCES "driver_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "withdraw_transaction" ADD CONSTRAINT "FK_1a2a175b3d0e7ce22bdda03a5fa" FOREIGN KEY ("driverTransactionId") REFERENCES "driver_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_transaction" ADD CONSTRAINT "FK_7b433bf733afdea636322f99920" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636" FOREIGN KEY ("paymentInfoId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636"`);
        await queryRunner.query(`ALTER TABLE "driver_transaction" DROP CONSTRAINT "FK_7b433bf733afdea636322f99920"`);
        await queryRunner.query(`ALTER TABLE "withdraw_transaction" DROP CONSTRAINT "FK_1a2a175b3d0e7ce22bdda03a5fa"`);
        await queryRunner.query(`ALTER TABLE "payin_transaction" DROP CONSTRAINT "FK_0e3cc5667761356fa4b047c1948"`);
        await queryRunner.query(`DROP TABLE "driver_transaction"`);
        await queryRunner.query(`DROP TABLE "withdraw_transaction"`);
        await queryRunner.query(`DROP TABLE "payin_transaction"`);
        await queryRunner.query(`ALTER TABLE "restaurant_profile" ADD CONSTRAINT "restaurant_profile_paymentInfoId_fkey" FOREIGN KEY ("paymentInfoId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
