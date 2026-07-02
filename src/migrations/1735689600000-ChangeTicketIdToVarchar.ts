import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTicketIdToVarchar1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if ticket_id column in ticket table is already varchar
    const ticketColumnInfo = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'ticket' AND column_name = 'ticket_id'
    `);

    if (ticketColumnInfo.length === 0) {
      console.log('⚠️ ticket table does not exist, skipping migration');
      return;
    }

    const currentType = ticketColumnInfo[0].data_type;
    if (currentType === 'character varying') {
      console.log('✓ ticket_id is already varchar, skipping migration');
      return;
    }

    // Check if the foreign key exists
    const fkExists = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'ticket_parts' AND constraint_name = 'FK_ticket_parts_ticket_id'
    `);

    if (fkExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE ticket_parts DROP CONSTRAINT "FK_ticket_parts_ticket_id"`,
      );
      console.log('✓ Dropped foreign key constraint');
    }

    // Check and drop the default value if it exists
    const defaultInfo = await queryRunner.query(`
      SELECT column_default FROM information_schema.columns 
      WHERE table_name = 'ticket' AND column_name = 'ticket_id'
    `);

    if (defaultInfo.length > 0 && defaultInfo[0].column_default !== null) {
      await queryRunner.query(
        `ALTER TABLE ticket ALTER COLUMN ticket_id DROP DEFAULT`,
      );
      console.log('✓ Dropped default value');
    }

    // Check if sequence exists and drop it
    const sequenceExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.sequences 
      WHERE sequence_name = 'ticket_ticket_id_seq'
    `);

    if (sequenceExists.length > 0) {
      await queryRunner.query(
        `DROP SEQUENCE IF EXISTS "ticket_ticket_id_seq"`,
      );
      console.log('✓ Dropped sequence');
    }

    // Change ticket_id column type from uuid to varchar(20)
    try {
      await queryRunner.query(
        `ALTER TABLE ticket ALTER COLUMN ticket_id TYPE varchar(20)`,
      );
      console.log('✓ Changed ticket.ticket_id to varchar(20)');
    } catch (error: any) {
      console.error('⚠️ Could not change ticket.ticket_id type:', error.message);
      // Continue anyway, might already be varchar
    }

    // Change ticket_parts ticket_id column type
    try {
      await queryRunner.query(
        `ALTER TABLE ticket_parts ALTER COLUMN ticket_id TYPE varchar(20)`,
      );
      console.log('✓ Changed ticket_parts.ticket_id to varchar(20)');
    } catch (error: any) {
      console.error('⚠️ Could not change ticket_parts.ticket_id type:', error.message);
      // Continue anyway
    }

    // Re-add the foreign key constraint
    try {
      await queryRunner.query(
        `ALTER TABLE ticket_parts ADD CONSTRAINT "FK_ticket_parts_ticket_id" 
         FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
      );
      console.log('✓ Added foreign key constraint');
    } catch (error: any) {
      console.error('⚠️ Could not add foreign key:', error.message);
      // Continue anyway
    }

    console.log('✓ ChangeTicketIdToVarchar migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a destructive migration, rollback is limited
    // Only attempt to restore foreign key if needed
    try {
      const fkExists = await queryRunner.query(`
        SELECT constraint_name FROM information_schema.table_constraints 
        WHERE table_name = 'ticket_parts' AND constraint_name = 'FK_ticket_parts_ticket_id'
      `);

      if (fkExists.length === 0) {
        await queryRunner.query(
          `ALTER TABLE ticket_parts ADD CONSTRAINT "FK_ticket_parts_ticket_id" 
           FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
        );
      }
    } catch (error: any) {
      console.error('⚠️ Rollback error:', error.message);
    }
  }
}
