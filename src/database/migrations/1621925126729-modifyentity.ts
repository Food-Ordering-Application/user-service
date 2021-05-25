import {MigrationInterface, QueryRunner} from "typeorm";

export class modifyentity1621925126729 implements MigrationInterface {
    name = 'modifyentity1621925126729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "verifyPhoneNumberOTP"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "verifyPhoneNumberOTP" character varying`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "sessionInfo" character varying`);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "sessionInfo"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "verifyPhoneNumberOTP"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "verifyPhoneNumberOTP" character varying`);
    }

}
