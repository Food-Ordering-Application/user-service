import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1623048867254 implements MigrationInterface {
  name = 'modifyEntity1623048867254';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver" ADD "isActive" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "isActive"`);
  }
}
