import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetCondition1715000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the condition column already exists
    const hasColumn = await queryRunner.hasColumn('asset', 'condition');

    if (!hasColumn) {
      // Add the condition column if it doesn't exist
      await queryRunner.query(
        `ALTER TABLE "asset" ADD COLUMN "condition" varchar(20) NOT NULL DEFAULT 'good'`,
      );

      // Add constraint for valid condition values
      await queryRunner.query(
        `ALTER TABLE "asset" ADD CONSTRAINT "CHK_asset_condition" CHECK ("condition" IN ('excellent', 'good', 'fair', 'poor', 'broken'))`,
      );

      console.log('✅ Added condition column to asset table');
    } else {
      console.log('ℹ️ Condition column already exists in asset table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('asset', 'condition');

    if (hasColumn) {
      // Remove the constraint first
      await queryRunner.query(
        `ALTER TABLE "asset" DROP CONSTRAINT IF EXISTS "CHK_asset_condition"`,
      );

      // Remove the column
      await queryRunner.query(
        `ALTER TABLE "asset" DROP COLUMN "condition"`,
      );

      console.log('✅ Removed condition column from asset table');
    }
  }
}
