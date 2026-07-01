import { AppDataSource } from './src/data-source';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const { v4: uuidv4 } = require('uuid');
    
    // Create admin employee
    const employeeId = uuidv4();
    const email = 'admin@ithelp.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Get a branch
    const branch = await AppDataSource.query('SELECT branch_id FROM branch LIMIT 1');
    const branchId = branch[0]?.branch_id;
    
    // Get a department
    const dept = await AppDataSource.query('SELECT department_id FROM department LIMIT 1');
    const deptId = dept[0]?.department_id;

    if (!branchId || !deptId) {
      console.log('❌ Need at least one branch and department');
      await AppDataSource.destroy();
      return;
    }

    // Check if admin already exists
    const existingUser = await AppDataSource.query(
      'SELECT * FROM user_account WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      console.log('⚠️  Admin user already exists');
      await AppDataSource.destroy();
      return;
    }

    // Insert employee
    const employeeResult = await AppDataSource.query(
      `INSERT INTO employee (employee_id, first_name, last_name, email, role, branch_id, department_id, employment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING employee_id`,
      [employeeId, 'Admin', 'User', email, 'admin', branchId, deptId, true]
    );

    console.log('✓ Admin employee created:', employeeId);

    // Insert user account
    await AppDataSource.query(
      `INSERT INTO user_account (employee_id, email, password)
       VALUES ($1, $2, $3)`,
      [employeeId, email, hashedPassword]
    );

    console.log('✓ Admin user created');
    console.log('\n✅ Admin credentials:');
    console.log('   Email: admin@ithelp.com');
    console.log('   Password: admin123');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdmin();
