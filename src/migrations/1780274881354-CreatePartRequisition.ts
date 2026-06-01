import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePartRequisition1780274881354 implements MigrationInterface {
    name = 'CreatePartRequisition1780274881354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`CREATE TYPE "public"."part_requisitions_requested_by_type_enum" AS ENUM('it', 'warehouse')`);
        await queryRunner.query(`CREATE TYPE "public"."part_requisitions_status_enum" AS ENUM('pending', 'pending_admin_review', 'approved', 'rejected')`);

        // Create part_requisitions table
        await queryRunner.query(`CREATE TABLE "part_requisitions" (
            "requisition_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "rf_number" character varying NOT NULL UNIQUE,
            "requested_by" uuid NOT NULL,
            "requested_by_type" "public"."part_requisitions_requested_by_type_enum" NOT NULL DEFAULT 'warehouse',
            "department" character varying,
            "deadline" TIMESTAMP,
            "status" "public"."part_requisitions_status_enum" NOT NULL DEFAULT 'pending',
            "acknowledged_by" uuid,
            "acknowledged_at" TIMESTAMP,
            "acknowledged_notes" character varying,
            "approved_by" uuid,
            "approved_at" TIMESTAMP,
            "rejection_reason" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_491f2b35a802dd681e3d936fb79" PRIMARY KEY ("requisition_id")
        )`);

        // Create requisition_items table
        await queryRunner.query(`CREATE TABLE "requisition_items" (
            "item_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "requisition_id" uuid NOT NULL,
            "item_name" character varying NOT NULL,
            "quantity" integer NOT NULL,
            "unit" character varying NOT NULL,
            "supplier" character varying,
            "unit_cost" numeric(10,2),
            "total_cost" numeric(10,2),
            "purpose_remarks" character varying,
            CONSTRAINT "PK_1308206f15577f0e5d02d91e89a" PRIMARY KEY ("item_id")
        )`);

        // Add foreign keys
        await queryRunner.query(`ALTER TABLE "requisition_items" ADD CONSTRAINT "FK_2afa61cf14fa20efa7dc12883dd" FOREIGN KEY ("requisition_id") REFERENCES "part_requisitions"("requisition_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "part_requisitions" ADD CONSTRAINT "FK_da27edbe439cb1130d094b9e254" FOREIGN KEY ("requested_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "part_requisitions" ADD CONSTRAINT "FK_7ac7114dcad0b10beacdcfdc839" FOREIGN KEY ("acknowledged_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "part_requisitions" ADD CONSTRAINT "FK_0cc6bfdf454e7cb255381de1e5a" FOREIGN KEY ("approved_by") REFERENCES "employee"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "part_requisitions" DROP CONSTRAINT "FK_0cc6bfdf454e7cb255381de1e5a"`);
        await queryRunner.query(`ALTER TABLE "part_requisitions" DROP CONSTRAINT "FK_7ac7114dcad0b10beacdcfdc839"`);
        await queryRunner.query(`ALTER TABLE "part_requisitions" DROP CONSTRAINT "FK_da27edbe439cb1130d094b9e254"`);
        await queryRunner.query(`ALTER TABLE "requisition_items" DROP CONSTRAINT "FK_2afa61cf14fa20efa7dc12883dd"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "requisition_items"`);
        await queryRunner.query(`DROP TABLE "part_requisitions"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."part_requisitions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."part_requisitions_requested_by_type_enum"`);
    }
}
