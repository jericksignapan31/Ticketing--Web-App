import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddTicketPartsTracking1726050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('ticket');

    // Add columns to ticket table if they don't exist
    const unitStatusColumn = table?.findColumnByName('unit_status');
    if (!unitStatusColumn) {
      await queryRunner.addColumn(
        'ticket',
        new TableColumn({
          name: 'unit_status',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
    }

    const observationColumn = table?.findColumnByName('observation');
    if (!observationColumn) {
      await queryRunner.addColumn(
        'ticket',
        new TableColumn({
          name: 'observation',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const actionTakenColumn = table?.findColumnByName('action_taken');
    if (!actionTakenColumn) {
      await queryRunner.addColumn(
        'ticket',
        new TableColumn({
          name: 'action_taken',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const recommendationColumn = table?.findColumnByName('recommendation');
    if (!recommendationColumn) {
      await queryRunner.addColumn(
        'ticket',
        new TableColumn({
          name: 'recommendation',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const resolutionNotesColumn = table?.findColumnByName('resolution_notes');
    if (!resolutionNotesColumn) {
      await queryRunner.addColumn(
        'ticket',
        new TableColumn({
          name: 'resolution_notes',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    // Create ticket_parts table if it doesn't exist
    const ticketPartsTable = await queryRunner.getTable('ticket_parts');
    if (!ticketPartsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'ticket_parts',
          columns: [
            {
              name: 'part_id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'ticket_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'part_name',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'quantity',
              type: 'integer',
              isNullable: false,
            },
            {
              name: 'unit_cost',
              type: 'numeric',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'total_cost',
              type: 'numeric',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'supplier',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'pending'",
              isNullable: false,
            },
            {
              name: 'requested_date',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'received_date',
              type: 'timestamp',
              isNullable: true,
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
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['ticket_id'],
              referencedTableName: 'ticket',
              referencedColumnNames: ['ticket_id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop ticket_parts table
    const ticketPartsTable = await queryRunner.getTable('ticket_parts');
    if (ticketPartsTable) {
      await queryRunner.dropTable('ticket_parts');
    }

    const table = await queryRunner.getTable('ticket');

    // Remove columns from ticket table
    const columnsToRemove = [
      'resolution_notes',
      'recommendation',
      'action_taken',
      'observation',
      'unit_status',
    ];

    for (const columnName of columnsToRemove) {
      const column = table?.findColumnByName(columnName);
      if (column) {
        await queryRunner.dropColumn('ticket', column);
      }
    }
  }
}
