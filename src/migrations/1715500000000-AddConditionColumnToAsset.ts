import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConditionColumnToAsset1715500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('asset');

    if (table && !table.columns.find(col => col.name === 'condition')) {
      await queryRunner.addColumn(
        'asset',
        new TableColumn({
          name: 'condition',
          type: 'varchar',
          length: '20',
          isNullable: true,
          default: "'good'",
        }),
      );
      console.log('✅ Added condition column to asset table');
    } else {
      console.log('ℹ️ Condition column already exists or table not found');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('asset');

    if (table && table.columns.find(col => col.name === 'condition')) {
      await queryRunner.dropColumn('asset', 'condition');
      console.log('✅ Dropped condition column from asset table');
    }
  }
}
