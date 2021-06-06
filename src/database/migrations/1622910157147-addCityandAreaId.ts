import { MigrationInterface, QueryRunner } from 'typeorm';

export class addCityandAreaId1622910157147 implements MigrationInterface {
  name = 'addCityandAreaId1622910157147';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD "areaId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ADD "cityId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ALTER COLUMN "area" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ALTER COLUMN "city" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ALTER COLUMN "city" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" ALTER COLUMN "area" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP COLUMN "cityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_profile" DROP COLUMN "areaId"`,
    );
  }
}
