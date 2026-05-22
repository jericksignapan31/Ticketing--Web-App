const { DataSource } = require('typeorm');
require('dotenv').config();

async function diagnoseAdmin() {
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
    console.log('✅ Connected to database');
    
    // Check user_account table
    console.log('\n📋 Checking user_account table:');
    const allUsers = await AppDataSource.query(`
      SELECT user_id, employee_id, username, password FROM "user_account" LIMIT 10;
    `);
    console.log(`Total users in DB: ${allUsers.length}`);
    allUsers.forEach((u, i) => {
      console.log(`  ${i+1}. username=${u.username}, employee_id=${u.employee_id}`);
    });
    
    // Check specific admin
    console.log('\n🔍 Looking for admin@ithelp.com:');
    const adminUser = await allUsers.find(u => u.username === 'admin@ithelp.com');
    if (adminUser) {
      console.log('  ✅ Found! User ID:', adminUser.user_id);
      
      // Check if password hash is correct
      const bcrypt = require('bcrypt');
      const correctHash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
      const isValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('  Password hash matches:', isValid);
    } else {
      console.log('  ❌ Not found! Creating now...');
      
      // Get admin employee
      const adminEmployee = await AppDataSource.query(`
        SELECT employee_id FROM "employee" WHERE email = 'admin@ithelp.com';
      `);
      
      if (adminEmployee.length === 0) {
        console.log('  ❌ ERROR: Admin employee not found in database!');
      } else {
        const employeeId = adminEmployee[0].employee_id;
        const hash = '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W';
        
        // Insert admin user account
        await AppDataSource.query(`
          INSERT INTO "user_account" (user_id, employee_id, username, password, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, 'admin@ithelp.com', $2, NOW(), NOW());
        `, [employeeId, hash]);
        
        console.log('  ✅ Admin user account created successfully!');
        
        // Verify
        const check = await AppDataSource.query(`
          SELECT u.username, e.email FROM "user_account" u
          LEFT JOIN "employee" e ON u.employee_id = e.employee_id
          WHERE u.username = 'admin@ithelp.com';
        `);
        console.log('  Verification:', check[0]);
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnoseAdmin();
