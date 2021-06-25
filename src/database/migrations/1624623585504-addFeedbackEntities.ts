import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFeedbackEntities1624623585504 implements MigrationInterface {
  name = 'addFeedbackEntities1624623585504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "driver_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" character varying NOT NULL, "customerId" character varying NOT NULL, "driverId" character varying NOT NULL, "message" character varying, "rate" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_02fe17d726e0897b23b41842903" UNIQUE ("orderId"), CONSTRAINT "PK_f79de45edea97f267446ff6d127" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_565204726c1b938f32b5f2cc90" ON "driver_feedback" ("driverId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e029975c99ac614b7805259d71" ON "driver_feedback" ("rate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d199ffe9d0688af0d0c39db4bf" ON "driver_feedback" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback_reason" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "type" integer NOT NULL, "displayOrder" integer NOT NULL, CONSTRAINT "PK_73ca2a6f14c14437480547aca71" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37b6cc1efcb5793567e26d5d42" ON "feedback_reason" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_feedback" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" character varying NOT NULL, "customerId" character varying NOT NULL, "restaurantId" character varying NOT NULL, "message" character varying, "rate" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_44e9a47e562a35c0f2724104885" UNIQUE ("orderId"), CONSTRAINT "PK_c1ebbf6f257354ae416bc42be18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_41bb24bd7714108797a6dbb972" ON "restaurant_feedback" ("restaurantId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12858a499715d4c887fb646b9c" ON "restaurant_feedback" ("rate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9628c868f683281d568601c124" ON "restaurant_feedback" ("createdAt") `,
    );
    await queryRunner.query(`ALTER TABLE "driver" ADD "rating" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "rating"`);
    await queryRunner.query(`DROP INDEX "IDX_9628c868f683281d568601c124"`);
    await queryRunner.query(`DROP INDEX "IDX_12858a499715d4c887fb646b9c"`);
    await queryRunner.query(`DROP INDEX "IDX_41bb24bd7714108797a6dbb972"`);
    await queryRunner.query(`DROP TABLE "restaurant_feedback"`);
    await queryRunner.query(`DROP INDEX "IDX_37b6cc1efcb5793567e26d5d42"`);
    await queryRunner.query(`DROP TABLE "feedback_reason"`);
    await queryRunner.query(`DROP INDEX "IDX_d199ffe9d0688af0d0c39db4bf"`);
    await queryRunner.query(`DROP INDEX "IDX_e029975c99ac614b7805259d71"`);
    await queryRunner.query(`DROP INDEX "IDX_565204726c1b938f32b5f2cc90"`);
    await queryRunner.query(`DROP TABLE "driver_feedback"`);
  }
}
