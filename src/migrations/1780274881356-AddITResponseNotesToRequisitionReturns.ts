import { MigrationInterface, QueryRunner } from "typeorm";

export class AddITResponseNotesToRequisitionReturns1780274881356 implements MigrationInterface {
    name = 'AddITResponseNotesToRequisitionReturns1780274881356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists before adding
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'requisition_returns' 
                AND column_name = 'it_response_notes'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (!columnResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "requisition_returns" ADD COLUMN "it_response_notes" text`
            );
            console.log('✅ Added it_response_notes column to requisition_returns table');
        } else {
            console.log('ℹ️  it_response_notes column already exists in requisition_returns table');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before removing
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'requisition_returns' 
                AND column_name = 'it_response_notes'
            );
        `;
        const columnResult = await queryRunner.query(columnsQuery);
        
        if (columnResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "requisition_returns" DROP COLUMN "it_response_notes"`
            );
            console.log('✅ Removed it_response_notes column from requisition_returns table');
        }
    }
}
