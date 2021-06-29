import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1624993551780 implements MigrationInterface {
  name = 'modifyEntity1624993551780';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "isBanned" boolean DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "isBanned"`);
  }
}
