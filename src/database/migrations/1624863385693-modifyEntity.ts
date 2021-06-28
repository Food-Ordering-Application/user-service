import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1624863385693 implements MigrationInterface {
  name = 'modifyEntity1624863385693';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ADD "paymentMethod" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_transaction" DROP COLUMN "paymentMethod"`,
    );
  }
}
