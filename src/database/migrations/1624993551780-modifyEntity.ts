import {MigrationInterface, QueryRunner} from "typeorm";

export class modifyEntity1624993551780 implements MigrationInterface {
    name = 'modifyEntity1624993551780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b"`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_a120a507b710419db8b55810441"`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_d6617b1c74217403ac7480839b1"`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "isBanned" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b" FOREIGN KEY ("restaurantFeedbackId") REFERENCES "restaurant_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_a120a507b710419db8b55810441" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_d6617b1c74217403ac7480839b1" FOREIGN KEY ("driverFeedbackId") REFERENCES "driver_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a"`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" DROP CONSTRAINT "FK_d6617b1c74217403ac7480839b1"`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_a120a507b710419db8b55810441"`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" DROP CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "isBanned"`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_f0c80bd2bd0ec39494434cf497a" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_feedback_reasons" ADD CONSTRAINT "FK_d6617b1c74217403ac7480839b1" FOREIGN KEY ("driverFeedbackId") REFERENCES "driver_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_a120a507b710419db8b55810441" FOREIGN KEY ("feedbackReasonId") REFERENCES "feedback_reason"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "restaurant_feedback_reasons" ADD CONSTRAINT "FK_ec9a98ebac03e0624cccaf1404b" FOREIGN KEY ("restaurantFeedbackId") REFERENCES "restaurant_feedback"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
