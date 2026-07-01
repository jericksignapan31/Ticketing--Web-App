import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';

async function createUserAccount() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    // Get first employee
    const employees = await AppDataSource.query('SELECT employee_id, email FROM employee LIMIT 1');
    
    if (employees.length === 0) {
      console.log('❌ No employees found');
      await AppDataSource.destroy();
      return;
    }

    const employee = employees[0];
    const password = 'Test@12345';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existing = await AppDataSource.query(
      'SELECT * FROM user_account WHERE employee_id = $1',
      [employee.employee_id]
    );

    if (existing.length > 0) {
      console.log('⚠️  User account already exists');
      await AppDataSource.destroy();
      return;
    }

    // Insert user account
    await AppDataSource.query(
      'INSERT INTO user_account (employee_id, email, password) VALUES ($1, $2, $3)',
      [employee.employee_id, employee.email, hashedPassword]
    );

    console.log(`✅ User account created`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Password: ${password}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUserAccount();
