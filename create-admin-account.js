const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminAccount() {
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
    
    // Generate bcrypt hash for admin123
    const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
    
    // Create admin user account
    const result = await AppDataSource.query(`
      INSERT INTO "user_account" (user_id, employee_id, username, password, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        employee_id,
        'admin@ithelp.com',
        $1,
        NOW(),
        NOW()
      FROM "employee"
      WHERE email = 'admin@ithelp.com'
      ON CONFLICT (username) DO NOTHING;
    `, [hash]);
    
    console.log('✅ Admin user account created successfully');

    // Verify
    const check = await AppDataSource.query(`
      SELECT u.user_id, u.username, e.email, e.employment_status
      FROM "user_account" u
      LEFT JOIN "employee" e ON u.employee_id = e.employee_id
      WHERE u.username = 'admin@ithelp.com';
    `);
    
    console.log('✅ Verification:', check[0]);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminAccount();
