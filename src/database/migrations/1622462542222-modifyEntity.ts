import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1622462542222 implements MigrationInterface {
  name = 'modifyEntity1622462542222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver" ADD "licensePlate" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver" ADD "avatar" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636" FOREIGN KEY ("paymentInfoId") REFERENCES "payment_info"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP CONSTRAINT "FK_01cebb5e2c2b565ebc0d7097636"`,
    );
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "avatar"`);
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "licensePlate"`);
  }
}
