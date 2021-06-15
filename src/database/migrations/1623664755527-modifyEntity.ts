import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1623664755527 implements MigrationInterface {
  name = 'modifyEntity1623664755527';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ADD "commissionFee" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" ADD "income" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "delivery_history" DROP COLUMN "income"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_history" DROP COLUMN "commissionFee"`,
    );
  }
}
