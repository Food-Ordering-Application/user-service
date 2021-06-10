import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1623308644286 implements MigrationInterface {
  name = 'modifyEntity1623308644286';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD "isAutoConfirm" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" DROP CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ALTER COLUMN "driverId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" DROP CONSTRAINT "FK_52f0d14f6d3e4f916619b436851"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ALTER COLUMN "driverId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ALTER COLUMN "driverId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ALTER COLUMN "driverId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ADD CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ADD CONSTRAINT "FK_52f0d14f6d3e4f916619b436851" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_transaction" DROP CONSTRAINT "FK_52f0d14f6d3e4f916619b436851"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" DROP CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ALTER COLUMN "driverId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ALTER COLUMN "driverId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ALTER COLUMN "driverId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ADD CONSTRAINT "FK_52f0d14f6d3e4f916619b436851" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ALTER COLUMN "driverId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ADD CONSTRAINT "FK_3bd06f5d14b18844e8e735caf65" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP COLUMN "isAutoConfirm"`,
    );
  }
}
