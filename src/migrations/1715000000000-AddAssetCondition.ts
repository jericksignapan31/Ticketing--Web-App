import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetCondition1715000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Try to add the condition column
      await queryRunner.query(
        `ALTER TABLE "asset" ADD COLUMN "condition" VARCHAR(20) DEFAULT 'good'`,
      );
      console.log('✅ Condition column added successfully');
    } catch (error) {
      // Column might already exist, which is fine
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️ Condition column already exists, skipping...');
      } else {
        console.error('Migration error:', error.message);
        throw error;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE "asset" DROP COLUMN "condition"`);
      console.log('✅ Condition column removed successfully');
    } catch (error) {
      console.log('ℹ️ Condition column does not exist, skipping...');
    }
  }
}

