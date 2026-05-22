const { DataSource } = require('typeorm');
require('dotenv').config();

async function updateAdminAccount() {
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
    
    // Update existing admin user account: change username from EMP001 to admin@ithelp.com and update password
    console.log('Updating existing admin user account...');
    const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
    
    await AppDataSource.query(`
      UPDATE "user_account"
      SET username = 'admin@ithelp.com', password = $1, updated_at = NOW()
      WHERE employee_id = 'EMP001';
    `, [hash]);
    console.log('✅ Updated admin account\n');
    
    // Verify
    console.log('Verifying...');
    const check = await AppDataSource.query(`
      SELECT u.user_id, u.username, u.employee_id, e.email, e.employment_status
      FROM "user_account" u
      LEFT JOIN "employee" e ON u.employee_id = e.employee_id
      WHERE u.employee_id = 'EMP001';
    `);
    
    if (check.length > 0) {
      console.log('✅ Admin account updated!');
      console.log(`   Username: ${check[0].username}`);
      console.log(`   Email: ${check[0].email}`);
      console.log(`   Employment Status: ${check[0].employment_status}`);
      console.log(`   User ID: ${check[0].user_id}\n`);
      console.log('🎉 You can now login with:');
      console.log('   Email (Username): admin@ithelp.com');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Account not found!');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateAdminAccount();
