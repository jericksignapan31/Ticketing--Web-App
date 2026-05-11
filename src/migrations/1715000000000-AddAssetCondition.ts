import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetCondition1715000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check if the condition column already exists
    const table = await queryRunner.getTable('asset');
    const hasConditionColumn = table?.columns.some(col => col.name === 'condition');

    if (!hasConditionColumn) {
      console.log('🔧 Adding condition column to asset table...');
      
      // Add the condition column with default value
      await queryRunner.query(
        `ALTER TABLE "asset" ADD COLUMN IF NOT EXISTS "condition" VARCHAR(20) DEFAULT 'good'`,
      );

      console.log('✅ Condition column added successfully');
    } else {
      console.log('ℹ️ Condition column already exists, skipping...');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('asset');
    const hasConditionColumn = table?.columns.some(col => col.name === 'condition');

    if (hasConditionColumn) {
      console.log('🔧 Removing condition column from asset table...');
      
      await queryRunner.query(
        `ALTER TABLE "asset" DROP COLUMN IF EXISTS "condition"`,
      );

      console.log('✅ Condition column removed successfully');
    }
  }
}

