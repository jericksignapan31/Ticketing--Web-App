import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertDepartmentToRelationship1780274881357 implements MigrationInterface {
    name = 'ConvertDepartmentToRelationship1780274881357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if department_id column already exists
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'department_id'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (!columnResult[0].exists) {
            // Add new department_id column as UUID foreign key
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" ADD COLUMN "department_id" uuid`
            );

            // Migrate existing data from varchar department column to department_id
            // This assumes existing department values are valid UUIDs or null
            await queryRunner.query(
                `UPDATE "part_requisitions" 
                 SET "department_id" = "department"::uuid 
                 WHERE "department" IS NOT NULL AND "department" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'`
            );

            // Add foreign key constraint
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" 
                 ADD CONSTRAINT "FK_part_requisitions_department" 
                 FOREIGN KEY ("department_id") REFERENCES "department"("department_id") 
                 ON DELETE SET NULL ON UPDATE NO ACTION`
            );

            // Drop the old department column
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" DROP COLUMN "department"`
            );

            console.log('✅ Converted department from varchar to foreign key relationship');
        } else {
            console.log('ℹ️  department_id column already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if department column needs to be restored
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'department'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (!columnResult[0].exists) {
            // Add back the old department column
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" ADD COLUMN "department" varchar`
            );

            // Migrate data back from department_id to department column
            await queryRunner.query(
                `UPDATE "part_requisitions" 
                 SET "department" = "department_id"::text 
                 WHERE "department_id" IS NOT NULL`
            );

            // Drop the foreign key constraint
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" 
                 DROP CONSTRAINT "FK_part_requisitions_department"`
            );

            // Drop the department_id column
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" DROP COLUMN "department_id"`
            );

            console.log('✅ Reverted department from foreign key relationship to varchar');
        }
    }
}
