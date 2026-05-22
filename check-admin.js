const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkAdmin() {
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
    
    // Check user_account table
    const userAccountRaw = await AppDataSource.query(`
      SELECT * FROM "user_account" WHERE username = 'admin@ithelp.com';
    `);
    console.log('User Account:', userAccountRaw);

    // Check employee table
    const employeeRaw = await AppDataSource.query(`
      SELECT * FROM "employee" WHERE email = 'admin@ithelp.com';
    `);
    console.log('Employee:', employeeRaw);
    
    // Check if employment_status field exists
    const columnsRaw = await AppDataSource.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'employee' ORDER BY ordinal_position;
    `);
    console.log('Employee columns:', columnsRaw);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmin();
