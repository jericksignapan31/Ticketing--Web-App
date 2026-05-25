import { AppDataSource } from './src/data-source';

async function checkConstraints() {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  
  console.log('🔍 Checking database schema for constraints...\n');
  
  // Check foreign key constraints pointing TO asset table
  console.log('📍 Foreign Keys that reference asset table:');
  const refs = await AppDataSource.query(`
    SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
    FROM information_schema.key_column_usage
    WHERE foreign_table_name = 'asset'
  `);
  
  if (refs.length === 0) {
    console.log('  ✓ No foreign keys reference the asset table');
  } else {
    console.table(refs);
  }
  
  console.log('\n🔍 Checking all constraints on asset table:');
  const constraints = await AppDataSource.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      rc.match_option,
      rc.update_rule,
      rc.delete_rule,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.table_schema
    WHERE tc.table_name = 'asset'
    ORDER BY tc.constraint_type DESC
  `);
  
  console.table(constraints);
  
  console.log('\n✅ Database constraint check complete');
  process.exit(0);
}

checkConstraints().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
