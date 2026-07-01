import { AppDataSource } from './src/data-source';

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Running manual SQL migration...');

    // Drop the foreign key constraint from ticket_parts first
    try {
      await AppDataSource.query(
        `ALTER TABLE ticket_parts DROP CONSTRAINT "ticket_parts_ticket_id_fkey"`,
      );
      console.log('✓ Dropped foreign key constraint');
    } catch (e) {
      console.log('  (FK constraint not found, continuing...)');
    }

    // Drop the default value and sequence from ticket table
    try {
      await AppDataSource.query(
        `ALTER TABLE ticket ALTER COLUMN ticket_id DROP DEFAULT`,
      );
      console.log('✓ Dropped default value');
    } catch (e) {
      console.log('  (Default not found, continuing...)');
    }

    // Drop the sequence if it exists (correct PostgreSQL syntax)
    try {
      await AppDataSource.query(`DROP SEQUENCE IF EXISTS "ticket_ticket_id_seq"`);
      console.log('✓ Dropped sequence');
    } catch (e) {
      console.log('  (Sequence not found, continuing...)');
    }

    // Change ticket_id column type from uuid to varchar(20)
    await AppDataSource.query(
      `ALTER TABLE ticket ALTER COLUMN ticket_id TYPE varchar(20)`,
    );
    console.log('✓ Changed ticket.ticket_id to VARCHAR(20)');

    // Change ticket_parts ticket_id column type
    await AppDataSource.query(
      `ALTER TABLE ticket_parts ALTER COLUMN ticket_id TYPE varchar(20)`,
    );
    console.log('✓ Changed ticket_parts.ticket_id to VARCHAR(20)');

    // Re-add the foreign key constraint
    await AppDataSource.query(
      `ALTER TABLE ticket_parts ADD CONSTRAINT "ticket_parts_ticket_id_fkey" 
       FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id) ON DELETE CASCADE`,
    );
    console.log('✓ Re-added foreign key constraint');

    console.log('\n✓ Migration completed successfully!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigration();
