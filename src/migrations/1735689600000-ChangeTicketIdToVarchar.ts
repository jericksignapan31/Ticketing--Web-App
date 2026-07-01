import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTicketIdToVarchar1735689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint from ticket_parts first
    await queryRunner.query(
      `ALTER TABLE ticket_parts DROP CONSTRAINT "FK_ticket_parts_ticket_id"`,
    ).catch(() => null); // Ignore if constraint doesn't exist

    // Drop the default value and sequence from ticket table
    await queryRunner.query(
      `ALTER TABLE ticket ALTER COLUMN ticket_id DROP DEFAULT`,
    ).catch(() => null);

    // Drop the sequence if it exists
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS "ticket_ticket_id_seq"`,
    ).catch(() => null);

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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

    // Re-add the foreign key with original structure
    await queryRunner.query(
      `ALTER TABLE ticket_parts ADD CONSTRAINT "FK_ticket_parts_ticket_id" 
       FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
    );

    // Restore the sequence
    await queryRunner.query(
      `CREATE SEQUENCE "ticket_ticket_id_seq" OWNED BY ticket.ticket_id`,
    );
    await queryRunner.query(
      `ALTER TABLE ticket ALTER COLUMN ticket_id SET DEFAULT nextval('"ticket_ticket_id_seq"')`,
    );
  }
}
