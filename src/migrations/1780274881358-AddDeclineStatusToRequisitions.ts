import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeclineStatusToRequisitions1780274881358 implements MigrationInterface {
    name = 'AddDeclineStatusToRequisitions1780274881358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if enum value already exists before adding
        const enumCheckQuery = `
            SELECT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = 'declined_by_admin' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'part_requisitions_status_enum')
            );
        `;
        const enumResult = await queryRunner.query(enumCheckQuery);
        if (!enumResult[0].exists) {
            await queryRunner.query(`ALTER TYPE "public"."part_requisitions_status_enum" ADD VALUE 'declined_by_admin'`);
            console.log('✅ Added declined_by_admin to status enum');
        } else {
            console.log('ℹ️  declined_by_admin already exists in status enum');
        }

        // Check if decline_reason column exists
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'decline_reason'
            );
        `;
        const declineReasonResult = await queryRunner.query(columnsQuery);
        
        if (!declineReasonResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" ADD COLUMN "decline_reason" varchar`
            );
            console.log('✅ Added decline_reason column');
        } else {
            console.log('ℹ️  decline_reason column already exists');
        }

        // Check if declined_at column exists
        const declinedAtQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'declined_at'
            );
        `;
        const declinedAtResult = await queryRunner.query(declinedAtQuery);
        
        if (!declinedAtResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" ADD COLUMN "declined_at" TIMESTAMP`
            );
            console.log('✅ Added declined_at column');
        } else {
            console.log('ℹ️  declined_at column already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if declined_at column exists before removing
        const declinedAtQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'declined_at'
            );
        `;
        const declinedAtResult = await queryRunner.query(declinedAtQuery);
        
        if (declinedAtResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" DROP COLUMN "declined_at"`
            );
            console.log('✅ Removed declined_at column');
        }

        // Check if decline_reason column exists before removing
        const columnsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'part_requisitions' 
                AND column_name = 'decline_reason'
            );
        `;
        const declineReasonResult = await queryRunner.query(columnsQuery);
        
        if (declineReasonResult[0].exists) {
            await queryRunner.query(
                `ALTER TABLE "part_requisitions" DROP COLUMN "decline_reason"`
            );
            console.log('✅ Removed decline_reason column');
        }

        // Note: Removing enum values in PostgreSQL is not possible without dropping and recreating the type
        // For now, we'll just leave the enum value in place
        console.log('ℹ️  Note: declined_by_admin enum value cannot be removed in PostgreSQL');
    }
}
