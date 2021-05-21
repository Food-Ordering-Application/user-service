import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyCustomerEntity1621581466054 implements MigrationInterface {
  name = 'modifyCustomerEntity1621581466054';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "resetPasswordToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "resetPasswordTokenExpiration" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "resetPasswordTokenExpiration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "resetPasswordToken"`,
    );
  }
}
