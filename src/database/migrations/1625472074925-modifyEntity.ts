import { MigrationInterface, QueryRunner } from 'typeorm';

export class modifyEntity1625472074925 implements MigrationInterface {
  name = 'modifyEntity1625472074925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "restaurant_transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "restaurantId" character varying NOT NULL, "amount" integer NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_920e9664714868ea1b98034c753" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "restaurant_transaction"`);
  }
}
