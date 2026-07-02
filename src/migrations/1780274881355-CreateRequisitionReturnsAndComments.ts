import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRequisitionReturnsAndComments1780274881355 implements MigrationInterface {
    name = 'CreateRequisitionReturnsAndComments1780274881355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update enum type to include returned_by_warehouse status (if not already present)
        try {
            await queryRunner.query(`ALTER TYPE "public"."part_requisitions_status_enum" ADD VALUE 'returned_by_warehouse'`);
        } catch (error: any) {
            // Enum value might already exist, which is fine
            if (!error.message?.includes('already exists')) {
                throw error;
            }
        }

        // Create requisition_returns table
        await queryRunner.query(`CREATE TABLE "requisition_returns" (
            "return_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "requisition_id" uuid NOT NULL,
            "returned_by" uuid NOT NULL,
            "warehouse_notes" text NOT NULL,
            "return_cycle" integer NOT NULL DEFAULT 1,
            "resubmitted_by" uuid,
            "resubmitted_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_requisition_returns" PRIMARY KEY ("return_id")
        )`);

        // Create requisition_comments table
        await queryRunner.query(`CREATE TABLE "requisition_comments" (
            "comment_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "return_id" uuid NOT NULL,
            "commented_by" uuid NOT NULL,
            "role" character varying NOT NULL,
            "message" text NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_requisition_comments" PRIMARY KEY ("comment_id")
        )`);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "requisition_returns" ADD CONSTRAINT "FK_requisition_returns_requisition" FOREIGN KEY ("requisition_id") REFERENCES "part_requisitions"("requisition_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requisition_returns" ADD CONSTRAINT "FK_requisition_returns_returned_by" FOREIGN KEY ("returned_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requisition_returns" ADD CONSTRAINT "FK_requisition_returns_resubmitted_by" FOREIGN KEY ("resubmitted_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "requisition_comments" ADD CONSTRAINT "FK_requisition_comments_return" FOREIGN KEY ("return_id") REFERENCES "requisition_returns"("return_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requisition_comments" ADD CONSTRAINT "FK_requisition_comments_commented_by" FOREIGN KEY ("commented_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "requisition_comments" DROP CONSTRAINT "FK_requisition_comments_commented_by"`);
        await queryRunner.query(`ALTER TABLE "requisition_comments" DROP CONSTRAINT "FK_requisition_comments_return"`);

        await queryRunner.query(`ALTER TABLE "requisition_returns" DROP CONSTRAINT "FK_requisition_returns_resubmitted_by"`);
        await queryRunner.query(`ALTER TABLE "requisition_returns" DROP CONSTRAINT "FK_requisition_returns_returned_by"`);
        await queryRunner.query(`ALTER TABLE "requisition_returns" DROP CONSTRAINT "FK_requisition_returns_requisition"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "requisition_comments"`);
        await queryRunner.query(`DROP TABLE "requisition_returns"`);

        // Remove returned_by_warehouse from enum
        // Note: PostgreSQL doesn't allow removing enum values, so we'll just document this
    }
}
