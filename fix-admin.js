const { DataSource } = require('typeorm');
require('dotenv').config();

async function fixAdmin() {
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
    
    // Delete old records
    console.log('Deleting old admin user account...');
    await AppDataSource.query(`
      DELETE FROM "user_account" WHERE employee_id = 'EMP001' OR username = 'admin@ithelp.com';
    `);
    
    // Get admin employee
    const adminEmployee = await AppDataSource.query(`
      SELECT employee_id FROM "employee" WHERE email = 'admin@ithelp.com';
    `);
    
    if (adminEmployee.length === 0) {
      console.error('❌ Admin employee not found');
      await AppDataSource.destroy();
      return;
    }
    
    const employeeId = adminEmployee[0].employee_id;
    const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
    
    // Create new admin user account
    console.log('Creating admin user account...');
    await AppDataSource.query(`
      INSERT INTO "user_account" (user_id, employee_id, username, password, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, 'admin@ithelp.com', $2, NOW(), NOW());
    `, [employeeId, hash]);
    
    console.log('✅ Admin account created');
    
    // Verify
    const check = await AppDataSource.query(`
      SELECT u.user_id, u.username, u.employee_id, e.email, e.employment_status
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

fixAdmin();
