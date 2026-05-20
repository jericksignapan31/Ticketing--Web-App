import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateChatTables1716230400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversation table
    await queryRunner.createTable(
      new Table({
        name: 'conversation',
        columns: [
          {
            name: 'conversation_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['DIRECT', 'TICKET', 'GROUP'],
            default: "'DIRECT'",
          },
          {
            name: 'ticket_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'participant_ids',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create message table
    await queryRunner.createTable(
      new Table({
        name: 'message',
        columns: [
          {
            name: 'message_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sender_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for conversation
    await queryRunner.createForeignKey(
      'message',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['conversation_id'],
        referencedTableName: 'conversation',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for sender
    await queryRunner.createForeignKey(
      'message',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedColumnNames: ['user_id'],
        referencedTableName: 'user_account',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX idx_conversation_type ON conversation(type)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_message_conversation ON message(conversation_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_message_sender ON message(sender_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_message_is_read ON message(is_read)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_message_is_read`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_message_sender`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_message_conversation`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_conversation_type`);

    // Drop tables
    await queryRunner.dropTable('message', true);
    await queryRunner.dropTable('conversation', true);
  }
}
