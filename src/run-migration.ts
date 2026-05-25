import { AppDataSource } from './data-source';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function runMigration() {
  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
    }

    // Read migration SQL
    const migrationSQL = readFileSync(
      resolve(__dirname, './migrations/update-username-to-email.sql'),
      'utf-8',
    );

    console.log('🔄 Running migration...');
    console.log('---');

    // Execute migration
    await AppDataSource.query(migrationSQL);

    console.log('---');
    console.log('✅ Migration completed successfully');

    // Verify the column change
    const result = await AppDataSource.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'user_account' 
       AND column_name IN ('username', 'email')`,
    );

    console.log('📊 Columns in user_account table:');
    result.forEach((col: any) => {
      console.log(`  - ${col.column_name}`);
    });

    // Show sample data
    const users = await AppDataSource.query(
      `SELECT user_id, employee_id, email FROM "user_account" LIMIT 3`,
    );
    console.log('\n📋 Sample user_account data:');
    console.table(users);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
