import { AppDataSource } from './data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🚀 Running migration: add-soft-delete-to-asset.sql\n');

    const migrationPath = path.join(__dirname, 'migrations', 'add-soft-delete-to-asset.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into separate statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log(`📍 Executing: ${statement.substring(0, 50)}...`);
        await AppDataSource.query(statement);
        console.log('✅ Success\n');
      } catch (err) {
        const error = err as any;
        // Ignore error if column already exists (from previous migration run)
        if (error.message?.includes('already exists')) {
          console.log('⚠️  Column/index already exists - skipping\n');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration completed successfully');
    console.log('\n📊 Verifying schema...');
    
    const assetColumns = await AppDataSource.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'asset'
      ORDER BY ordinal_position
    `);
    
    console.table(assetColumns);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
