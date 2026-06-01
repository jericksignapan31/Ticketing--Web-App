import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFileAttachmentsTable1686000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create file_attachments table
    await queryRunner.createTable(
      new Table({
        name: 'file_attachments',
        columns: [
          {
            name: 'attachment_id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'file_size',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'preview_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'uploaded_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'file_attachments',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['message_id'],
        referencedTableName: 'message',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('file_attachments');
  }
}
