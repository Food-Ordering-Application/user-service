import { MigrationInterface, QueryRunner } from 'typeorm';

export class addFeedbackEntitiesFixed1624662939942
  implements MigrationInterface
{
  name = 'addFeedbackEntitiesFixed1624662939942';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback_reason" ("id" int4 NOT NULL, "content" character varying NOT NULL, "type" integer NOT NULL, "displayOrder" integer NOT NULL, "rate" integer NOT NULL, CONSTRAINT "PK_73ca2a6f14c14437480547aca71" PRIMARY KEY ("id"))`,
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
      `CREATE TABLE "restaurant_feedback_reasons" ("restaurantFeedbackId" uuid NOT NULL, "feedbackReasonId" integer NOT NULL, CONSTRAINT "PK_cff83eb357041422bdf39b9c154" PRIMARY KEY ("restaurantFeedbackId", "feedbackReasonId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec9a98ebac03e0624cccaf1404" ON "restaurant_feedback_reasons" ("restaurantFeedbackId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a120a507b710419db8b5581044" ON "restaurant_feedback_reasons" ("feedbackReasonId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "driver_feedback_reasons" ("driverFeedbackId" uuid NOT NULL, "feedbackReasonId" integer NOT NULL, CONSTRAINT "PK_2edb930e7419a3e8143f17b4d22" PRIMARY KEY ("driverFeedbackId", "feedbackReasonId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6617b1c74217403ac7480839b" ON "driver_feedback_reasons" ("driverFeedbackId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0c80bd2bd0ec39494434cf497" ON "driver_feedback_reasons" ("feedbackReasonId") `,
    );
    await queryRunner.query(`ALTER TABLE "driver" ADD "rating" integer`);
    await queryRunner.query(
      `ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b" FOREIGN KEY ("restaurantFeedbackId") REFERENCES "restaurant_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_a120a507b710419db8b55810441" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_d6617b1c74217403ac7480839b1" FOREIGN KEY ("driverFeedbackId") REFERENCES "driver_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_d6617b1c74217403ac7480839b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_a120a507b710419db8b55810441"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b"`,
    );
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "rating"`);
    await queryRunner.query(`DROP INDEX "IDX_f0c80bd2bd0ec39494434cf497"`);
    await queryRunner.query(`DROP INDEX "IDX_d6617b1c74217403ac7480839b"`);
    await queryRunner.query(`DROP TABLE "driver_feedback_reasons"`);
    await queryRunner.query(`DROP INDEX "IDX_a120a507b710419db8b5581044"`);
    await queryRunner.query(`DROP INDEX "IDX_ec9a98ebac03e0624cccaf1404"`);
    await queryRunner.query(`DROP TABLE "restaurant_feedback_reasons"`);
    await queryRunner.query(`DROP INDEX "IDX_d199ffe9d0688af0d0c39db4bf"`);
    await queryRunner.query(`DROP INDEX "IDX_e029975c99ac614b7805259d71"`);
    await queryRunner.query(`DROP INDEX "IDX_565204726c1b938f32b5f2cc90"`);
    await queryRunner.query(`DROP TABLE "driver_feedback"`);
    await queryRunner.query(`DROP INDEX "IDX_9628c868f683281d568601c124"`);
    await queryRunner.query(`DROP INDEX "IDX_12858a499715d4c887fb646b9c"`);
    await queryRunner.query(`DROP INDEX "IDX_41bb24bd7714108797a6dbb972"`);
    await queryRunner.query(`DROP TABLE "restaurant_feedback"`);
    await queryRunner.query(`DROP INDEX "IDX_37b6cc1efcb5793567e26d5d42"`);
    await queryRunner.query(`DROP TABLE "feedback_reason"`);
  }
}
