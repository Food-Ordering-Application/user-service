import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyentity1621677018517 implements MigrationInterface {
  name = 'modifyentity1621677018517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "resetPasswordTokenExpiration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "resetPasswordTokenExpiration" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" DROP COLUMN "resetPasswordTokenExpiration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "resetPasswordTokenExpiration" bigint`,
    );
  }
}
