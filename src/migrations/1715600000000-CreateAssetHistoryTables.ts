import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAssetHistoryTables1715600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create asset_status_history table
    await queryRunner.createTable(
      new Table({
        name: 'asset_status_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'previous_status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'new_status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'changed_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['asset_id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['changed_by'],
            referencedTableName: 'user_account',
            referencedColumnNames: ['user_id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_status_history',
      new TableIndex({
        name: 'IDX_asset_status_history_asset_created',
        columnNames: ['asset_id', 'created_at'],
      }),
    );

    // Create asset_assignment_history table
    await queryRunner.createTable(
      new Table({
        name: 'asset_assignment_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'previous_employee_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'new_employee_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['asset_id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['assigned_by'],
            referencedTableName: 'user_account',
            referencedColumnNames: ['user_id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['previous_employee_id'],
            referencedTableName: 'employee',
            referencedColumnNames: ['employee_id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['new_employee_id'],
            referencedTableName: 'employee',
            referencedColumnNames: ['employee_id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_assignment_history',
      new TableIndex({
        name: 'IDX_asset_assignment_history_asset_created',
        columnNames: ['asset_id', 'created_at'],
      }),
    );

    // Create asset_movement_history table
    await queryRunner.createTable(
      new Table({
        name: 'asset_movement_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'from_branch_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'to_branch_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'moved_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['asset_id'],
            referencedTableName: 'asset',
            referencedColumnNames: ['asset_id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['from_branch_id'],
            referencedTableName: 'branch',
            referencedColumnNames: ['branch_id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['to_branch_id'],
            referencedTableName: 'branch',
            referencedColumnNames: ['branch_id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['moved_by'],
            referencedTableName: 'user_account',
            referencedColumnNames: ['user_id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'asset_movement_history',
      new TableIndex({
        name: 'IDX_asset_movement_history_asset_created',
        columnNames: ['asset_id', 'created_at'],
      }),
    );

    console.log('✅ Asset history tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('asset_movement_history', 'IDX_asset_movement_history_asset_created');
    await queryRunner.dropTable('asset_movement_history');

    await queryRunner.dropIndex('asset_assignment_history', 'IDX_asset_assignment_history_asset_created');
    await queryRunner.dropTable('asset_assignment_history');

    await queryRunner.dropIndex('asset_status_history', 'IDX_asset_status_history_asset_created');
    await queryRunner.dropTable('asset_status_history');

    console.log('✅ Asset history tables dropped successfully');
  }
}
