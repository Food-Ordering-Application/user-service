import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1624862688743 implements MigrationInterface {
  name = 'modifyEntity1624862688743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_transaction" ADD "paymentMethod" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account_transaction" DROP COLUMN "paymentMethod"`,
    );
  }
}
