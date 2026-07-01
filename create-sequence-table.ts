import { AppDataSource } from './src/data-source';

async function createSequenceTable() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('Creating ticket_sequence table...');

    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS "ticket_sequence" (
        "date" varchar(10) PRIMARY KEY,
        "sequence" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ ticket_sequence table created successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  }
}

createSequenceTable();
