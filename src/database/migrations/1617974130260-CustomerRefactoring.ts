import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerRefactoring1617974130260 implements MigrationInterface {
  name = 'CustomerRefactoring1617974130260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "username" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_cb485a32c0e8b9819c08c1b1a1b" UNIQUE ("username")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD "password" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "phoneNumber" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ADD CONSTRAINT "UQ_2e64383bae8871598afb8b73f0d" UNIQUE ("phoneNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "name" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_2e64383bae8871598afb8b73f0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer" ALTER COLUMN "phoneNumber" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "customer" DROP CONSTRAINT "UQ_cb485a32c0e8b9819c08c1b1a1b"`,
    );
    await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "username"`);
  }
}
