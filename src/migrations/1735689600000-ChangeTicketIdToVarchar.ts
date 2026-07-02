import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTicketIdToVarchar1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Drop the foreign key constraint from ticket_parts first
      try {
        await queryRunner.query(
          `ALTER TABLE ticket_parts DROP CONSTRAINT "FK_ticket_parts_ticket_id"`,
        );
      } catch (error: any) {
        // Ignore if constraint doesn't exist
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
      }

      // Drop the default value from ticket table
      try {
        await queryRunner.query(
          `ALTER TABLE ticket ALTER COLUMN ticket_id DROP DEFAULT`,
        );
      } catch (error: any) {
        // Ignore if no default exists
        if (!error.message?.includes('does not exist')) {
          throw error;
        }
      }

      // Drop the sequence if it exists
      try {
        await queryRunner.query(
          `DROP SEQUENCE IF EXISTS "ticket_ticket_id_seq"`,
        );
      } catch (error: any) {
        // Ignore if sequence doesn't exist
      }

      // Change ticket_id column type from uuid to varchar(20)
      await queryRunner.query(
        `ALTER TABLE ticket ALTER COLUMN ticket_id TYPE varchar(20)`,
      );

      // Change ticket_parts ticket_id column type from default to varchar(20)
      await queryRunner.query(
        `ALTER TABLE ticket_parts ALTER COLUMN ticket_id TYPE varchar(20)`,
      );

      // Re-add the foreign key constraint
      await queryRunner.query(
        `ALTER TABLE ticket_parts ADD CONSTRAINT "FK_ticket_parts_ticket_id" 
         FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
      );
    } catch (error) {
      console.error('❌ Error in ChangeTicketIdToVarchar migration:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Drop the foreign key constraint
      await queryRunner.query(
        `ALTER TABLE ticket_parts DROP CONSTRAINT "FK_ticket_parts_ticket_id"`,
      );

      // Revert ticket_id back to uuid
      await queryRunner.query(
        `ALTER TABLE ticket ALTER COLUMN ticket_id TYPE uuid USING ticket_id::uuid`,
      );

      // Revert ticket_parts ticket_id back
      await queryRunner.query(
        `ALTER TABLE ticket_parts ALTER COLUMN ticket_id TYPE uuid USING ticket_id::uuid`,
      );

      // Re-add the original foreign key
      await queryRunner.query(
        `ALTER TABLE ticket_parts ADD CONSTRAINT "FK_ticket_parts_ticket_id" 
         FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
      );
    } catch (error) {
      console.error('❌ Error in ChangeTicketIdToVarchar rollback:', error);
      throw error;
    }
  }
}
