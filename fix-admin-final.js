const { DataSource } = require('typeorm');
require('dotenv').config();

async function fixAdminAccount() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');
    
    // Step 1: Delete the old admin user account (EMP001 username)
    console.log('Step 1: Deleting old admin user account with username=EMP001...');
    const deleteResult = await AppDataSource.query(`
      DELETE FROM "user_account" WHERE employee_id = 'EMP001';
    `);
    console.log('✅ Deleted old account\n');
    
    // Step 2: Create new admin user account with email as username
    console.log('Step 2: Creating new admin user account with email-based username...');
    const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
    
    await AppDataSource.query(`
      INSERT INTO "user_account" (user_id, employee_id, username, password, created_at, updated_at)
      VALUES (gen_random_uuid(), 'EMP001', 'admin@ithelp.com', $1, NOW(), NOW());
    `, [hash]);
    console.log('✅ Created new admin account\n');
    
    // Step 3: Verify
    console.log('Step 3: Verifying...');
    const check = await AppDataSource.query(`
      SELECT u.user_id, u.username, u.employee_id, e.email, e.employment_status
      FROM "user_account" u
      LEFT JOIN "employee" e ON u.employee_id = e.employee_id
      WHERE u.username = 'admin@ithelp.com';
    `);
    
    if (check.length > 0) {
      console.log('✅ Admin account ready!');
      console.log(`   Username: ${check[0].username}`);
      console.log(`   Email: ${check[0].email}`);
      console.log(`   Employment Status: ${check[0].employment_status}`);
      console.log(`   User ID: ${check[0].user_id}\n`);
      console.log('🎉 You can now login with:');
      console.log('   Email (Username): admin@ithelp.com');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Something went wrong!');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAdminAccount();
