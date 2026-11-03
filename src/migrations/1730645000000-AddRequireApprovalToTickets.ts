import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequireApprovalToTickets1730645000000 implements MigrationInterface {
    name = 'AddRequireApprovalToTickets1730645000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if require_approval column already exists
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'ticket' 
                AND column_name = 'require_approval'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (!columnResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "ticket" ADD COLUMN "require_approval" boolean DEFAULT true`
            );
            console.log('✅ Added require_approval column to ticket table');
        } else {
            console.log('ℹ️  require_approval column already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if require_approval column exists before removing
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'ticket' 
                AND column_name = 'require_approval'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (columnResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "ticket" DROP COLUMN "require_approval"`
            );
            console.log('✅ Removed require_approval column from ticket table');
        }
    }
}
